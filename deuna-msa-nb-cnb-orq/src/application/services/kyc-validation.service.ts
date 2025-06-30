import { Injectable, Inject } from '@nestjs/common';
import { GetKycDataUseCase } from '../use-cases/kyc/get-kyc-data.use-case';
import { ValidateLivenessUseCase } from '../use-cases/kyc/validate-liveness.use-case';
import { ValidateFacialMatchUseCase } from '../use-cases/kyc/validate-facial-match.use-case';
import { SaveValidationResultUseCase } from '../use-cases/kyc/save-validation-result.use-case';
import { GetOnboardingStateUseCase } from '../use-cases/kyc/get-onboarding-state.use-case';
import { UpdateOnboardingStateUseCase } from '../use-cases/kyc/update-onboarding-state.use-case';
import { KycValidationMessageDto } from '../dto/kyc-validation-message.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  KycClientPort,
  KYC_CLIENT_PORT,
} from '../ports/out/clients/kyc-client.port';
import {
  KycStoragePort,
  KYC_STORAGE_PORT,
} from '../ports/out/storage/kyc-storage.port';
import {
  OnboardingClientPort,
  ONBOARDING_CLIENT_PORT,
} from '../ports/out/clients/onboarding-client.port';
import { validateTrackingHeadersApi } from '../../domain/utils/validator-tracking-headers-api';
import { Logger } from '@deuna/tl-logger-nd';
import { OnboardingStatusUpdateRequestDto } from '../dto/onboarding/onboarding-status-update-request.dto';
import {
  KycValidationResult,
  LivenessValidationResult,
  FacialValidationResult,
} from '../dto/kyc-validation-result.dto';
import { statusResultValidationDocument } from '../../domain/enums/document-validation.enum';

/**
 * Service to handle KYC validation logic
 * Responsibility: Orchestrate the complete KYC validation flow
 * using use cases with single responsibility for complex operations
 */
@Injectable()
export class KycValidationService {
  private readonly getKycDataUseCase: GetKycDataUseCase;
  private readonly validateLivenessUseCase: ValidateLivenessUseCase;
  private readonly validateFacialMatchUseCase: ValidateFacialMatchUseCase;
  private readonly saveValidationResultUseCase: SaveValidationResultUseCase;
  private readonly getOnboardingStateUseCase: GetOnboardingStateUseCase;
  private readonly updateOnboardingStateUseCase: UpdateOnboardingStateUseCase;

  constructor(
    @Inject(KYC_STORAGE_PORT)
    private readonly storagePort: KycStoragePort,
    @Inject(KYC_CLIENT_PORT)
    private readonly kycClient: KycClientPort,
    @Inject(ONBOARDING_CLIENT_PORT)
    private readonly onboardingClient: OnboardingClientPort,
    private readonly logger: Logger,
  ) {
    this.getKycDataUseCase = new GetKycDataUseCase(this.storagePort);
    this.validateLivenessUseCase = new ValidateLivenessUseCase(this.kycClient);
    this.validateFacialMatchUseCase = new ValidateFacialMatchUseCase(
      this.kycClient,
    );
    this.saveValidationResultUseCase = new SaveValidationResultUseCase(
      this.storagePort,
    );
    this.getOnboardingStateUseCase = new GetOnboardingStateUseCase(
      this.onboardingClient,
    );
    this.updateOnboardingStateUseCase = new UpdateOnboardingStateUseCase(
      this.onboardingClient,
    );
  }

  /**
   * Processes a KYC validation message
   * @param message Message received from Kafka queue
   */
  async processValidationMessage(
    message: KycValidationMessageDto,
  ): Promise<void> {
    try {
      // 1. Validate and convert the message (integrated logic in the service)
      const validationMessage = await this.validateMessage(message);

      this.logger.log(
        `Processing KYC validation - ScanID: ${validationMessage.scanId}, Type: ${validationMessage.type}`,
      );

      // 2. Get stored KYC data (using use case)
      const kycData = await this.getKycDataUseCase.execute(
        validationMessage.scanId,
      );

      if (!kycData) {
        throw new Error(
          `KYC data not found for scanId: ${validationMessage.scanId}`,
        );
      }

      validateTrackingHeadersApi(
        this.logger,
        'Starting KYC Orchestrator Request',
        kycData.trackingInfo.sessionId,
        kycData.trackingInfo.trackingId,
        kycData.trackingInfo.requestId,
      );

      // 3. Determine and execute validation type
      const validationType = validationMessage.type;
      let validationResult;

      if (validationType === 'liveness') {
        this.logger.log(
          `Executing liveness validation for scanId: ${validationMessage.scanId}`,
        );

        // Verify that liveness data exists
        if (!kycData.livenessValidation) {
          throw new Error(
            `Liveness data not found for scanId: ${validationMessage.scanId}`,
          );
        }

        // 3.1. Extract only the livenessValidation data and execute validation
        validationResult = (await this.validateLivenessUseCase.execute(
          kycData.livenessValidation,
          kycData.trackingInfo,
        )) as LivenessValidationResult;

        // Log of liveness response before saving it to Redis
        this.logger.log(
          `Saving liveness response to Redis - ScanID: ${validationMessage.scanId}, Response: ${JSON.stringify(validationResult)}`,
        );

        // 3.2. Save result directly from service in Redis
        await this.saveValidationResultUseCase.execute(
          validationMessage.scanId,
          'liveness',
          validationResult,
        );

        // 3.3 Check onboarding state and update step status
        await this.processOnboardingState(
          kycData.trackingInfo,
          validationMessage.scanId,
          'cnb-liveness',
          this.isValidResult(validationResult, 'liveness'),
          validationResult,
          kycData.onboardingSessionId,
        );
      } else if (validationType === 'facial') {
        this.logger.log(
          `Executing facial validation for scanId: ${validationMessage.scanId}`,
        );

        // Verify that facial data exists
        if (!kycData.facialValidation) {
          throw new Error(
            `Facial validation data not found for scanId: ${validationMessage.scanId}`,
          );
        }

        // 3.1. Extract only the facialValidation data and execute validation
        validationResult = (await this.validateFacialMatchUseCase.execute(
          kycData.facialValidation,
          kycData.trackingInfo,
        )) as FacialValidationResult;

        // Log of facial response before saving it to Redis
        this.logger.log(
          `Saving facial response to Redis - ScanID: ${validationMessage.scanId}, Response: ${JSON.stringify(validationResult)}`,
        );

        // 3.2. Save result directly from service
        await this.saveValidationResultUseCase.execute(
          validationMessage.scanId,
          'facial',
          validationResult,
        );

        // 3.3 Check onboarding state and update step status
        await this.processOnboardingState(
          kycData.trackingInfo,
          validationMessage.scanId,
          'cnb-facial',
          this.isValidResult(validationResult, 'facial'),
          validationResult,
          kycData.onboardingSessionId,
        );
      } else {
        throw new Error(`Validation type not supported: ${validationType}`);
      }

      this.logger.log(
        `Validation ${validationType} completed for scanId: ${validationMessage.scanId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing validation message: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Validates message format and structure
   * @param message Message to validate
   * @returns Validated and converted message
   */
  private async validateMessage(
    message: any,
  ): Promise<KycValidationMessageDto> {
    try {
      // Convert plain object to class instance for validation
      const kycValidationMessage = plainToInstance(
        KycValidationMessageDto,
        this.parseMessage(message),
      );

      // Validate against class-validator decorators
      const errors = await validate(kycValidationMessage);

      if (errors.length > 0) {
        // Format validation errors for better readability
        const errorDetails = errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        }));

        this.logger.error(
          `Message validation failed: ${JSON.stringify(errorDetails)}`,
        );
        throw new Error('Invalid message format');
      }

      return kycValidationMessage;
    } catch (error) {
      this.logger.error('Error validating message:', error);
      throw error;
    }
  }

  /**
   * Parses a message from Kafka
   * Handles different message formats that may come from Kafka
   */
  private parseMessage(message: any): {
    scanId: string;
    type: string;
    timestamp: string;
  } {
    try {
      // If message is a string, try to parse it as JSON
      if (typeof message === 'string') {
        return JSON.parse(message);
      }

      // If message has a value property (common in Kafka messages)
      if (message && message.value) {
        // If value is a string, try to parse it as JSON
        if (typeof message.value === 'string') {
          return JSON.parse(message.value);
        }
        // If value is already an object, return it directly
        return message.value;
      }

      // If message is already in the expected format
      if (message && message.scanId && message.type) {
        return message;
      }

      throw new Error('Message format not recognized');
    } catch (error) {
      this.logger.error('Error parsing message:', error);
      throw new Error(`Error parsing message: ${error.message}`);
    }
  }

  /**
   * Processes onboarding state: gets current state and updates specific step
   * @param trackingInfo Tracking information that contains sessionId
   * @param scanId Scan ID for logging purposes
   * @param step Onboarding step to update
   * @param isSuccess Whether the step was successful
   * @param validationResult Original validation result for comments
   */
  private async processOnboardingState(
    trackingInfo: any,
    scanId: string,
    step: string,
    isSuccess: boolean,
    validationResult: KycValidationResult,
    onboardingSessionId: string,
  ): Promise<void> {
    if (trackingInfo && trackingInfo.sessionId) {
      try {
        // First get current onboarding state
        this.logger.log(
          `Getting onboarding state - SessionID: ${trackingInfo.sessionId}`,
        );

        let onboardingState;
        try {
          onboardingState =
            await this.getOnboardingStateUseCase.execute(onboardingSessionId);

          this.logger.log(
            `Onboarding state received - SessionID: ${trackingInfo.sessionId}, Status: ${onboardingState.status}`,
          );
        } catch (getStateError) {
          this.logger.error(
            `Error getting onboarding state: ${getStateError.message}`,
            getStateError,
          );
          return;
        }
        // Then update the specific step status
        const statusValidationResult = isSuccess
          ? statusResultValidationDocument.DONE
          : statusResultValidationDocument.FAILED;
        const comment = isSuccess
          ? `Validation completed successfully`
          : `Validation failed: ${validationResult.details?.serviceResultLog || 'No details available'}`;

        this.logger.log(
          `Updating onboarding step ${step} - SessionID: ${trackingInfo.sessionId}, Status: ${statusValidationResult}`,
        );

        const updateData: OnboardingStatusUpdateRequestDto = {
          status: 'SUCCESS',
          data: {
            onboardingSessionId: onboardingSessionId,
            statusResultValidation: statusValidationResult,
            comment,
          },
        };

        try {
          const updateResult = await this.updateOnboardingStateUseCase.execute(
            updateData,
            step,
          );

          this.logger.log(
            `Onboarding step updated - SessionID: ${trackingInfo.sessionId}, Step: ${step}, Result: ${JSON.stringify(updateResult)}`,
          );
        } catch (updateError) {
          this.logger.error(
            `Error updating onboarding state: ${updateError.message}`,
            updateError,
          );
        }
      } catch (error) {
        // Log error but don't fail the whole process
        this.logger.error(
          `Error processing onboarding state: ${error.message}. Continuing with validation flow.`,
          error,
        );
      }
    } else {
      this.logger.warn(
        `No sessionId available in trackingInfo for scanId: ${scanId}. Skipping onboarding state update.`,
      );
    }
  }

  /**
   * Determines if a validation result is successful based on its serviceResultLog
   * @param result Validation result
   * @param validationType Validation type (liveness or facial)
   */
  private isValidResult(
    result: KycValidationResult,
    validationType: 'liveness' | 'facial',
  ): boolean {
    // Verify that we have a valid response with details
    if (!result || !result.details || !result.details.serviceResultLog) {
      this.logger.warn(
        'Invalid validation result structure',
        JSON.stringify(result),
      );
      return false;
    }

    const serviceResultLog = result.details.serviceResultLog;

    // Verify based on the validation type
    if (validationType === 'liveness') {
      return serviceResultLog === 'Live';
    } else if (validationType === 'facial') {
      return serviceResultLog === 'Positive';
    }

    return false;
  }
}
