import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { KycDocumentValidationPort } from '../ports/in/document-validation.port';
import { DocumentValidationStartDto } from '../dto/document-validation-start.dto';
import { DocumentValidationStartServiceResponse } from '../dto/document-validation-response.dto';
import { formatLogger } from '../../domain/utils/format-logger';
import { DocumentValidationClientPort } from '../ports/out/clients/document-validation-client.port';
import { DOCUMENT_VALIDATION_CLIENT_PORT } from '../../domain/constants/injection.constants';
import { ONBOARDING_CLIENT_PORT } from '../ports/out/clients/onboarding-client.port';
import { OnboardingClientPort } from '../ports/out/clients/onboarding-client.port';
import { UpdateOnboardingStateUseCase } from '../use-cases/kyc/update-onboarding-state.use-case';
import { OnboardingStatusUpdateRequestDto } from '../dto/onboarding/onboarding-status-update-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { PublishDocumentValidationQueueUseCase } from '../use-cases/document-validation/publish-document-validation-queue.use-case';
import { GetDocumentValidationStatusUseCase } from '../use-cases/get-document-validation-status.use-case';
import {
  DocumentValidationStatus,
  statusResultValidationDocument,
} from '../../domain/enums/document-validation.enum';
import { DocumentValidationDataResultDto } from '../dto/document-validation-data-result.dto';
import { GetDocumentValidationDataUseCase } from '../use-cases/get-document-validation-data.use-case';
import { DocumentValidationResultStatus } from '../../domain/enums/document-validation.enum';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class KycDocumentValidationService implements KycDocumentValidationPort {
  private readonly logger = new Logger({
    context: KycDocumentValidationService.name,
  });
  private readonly updateOnboardingStateUseCase: UpdateOnboardingStateUseCase;
  private readonly retryDelayMs: number;
  constructor(
    @Inject(DOCUMENT_VALIDATION_CLIENT_PORT)
    private readonly documentValidationClient: DocumentValidationClientPort,
    @Inject(ONBOARDING_CLIENT_PORT)
    private readonly onboardingClient: OnboardingClientPort,
    private readonly publishDocumentValidationQueueUseCase: PublishDocumentValidationQueueUseCase,
    private readonly getDocumentValidationStatusUseCase: GetDocumentValidationStatusUseCase,
    private readonly getDocumentValidationDataUseCase: GetDocumentValidationDataUseCase,
    private readonly configService: ConfigService,
  ) {
    this.updateOnboardingStateUseCase = new UpdateOnboardingStateUseCase(
      this.onboardingClient,
    );
    this.retryDelayMs = this.configService.get<number>(
      'RETRY_DELAY_MS_QUEUE_IDENTITY_DOCUMENT_VALIDATION',
    );
    if (!this.retryDelayMs) {
      this.retryDelayMs = 10000;
    }
  }

  async startValidation(
    input: DocumentValidationStartDto,
  ): Promise<DocumentValidationStartServiceResponse> {
    input.requestId = uuidv4();
    formatLogger(
      this.logger,
      'info',
      `Starting document validation for onboardingSessionId *${input.onboardingSessionId}* into MSA_TL_KYC`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    const { onboardingSessionId, ...validationRequest } = input;

    const respValidationDocument =
      await this.documentValidationClient.startValidation(validationRequest);

    formatLogger(
      this.logger,
      'info',
      `Finished initiating document validation for onboardingSessionId *${input.onboardingSessionId}* into MSA_TL_KYC`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    let statusValidationResult: string;
    if (respValidationDocument.scanReference) {
      statusValidationResult = 'PENDING';
    } else {
      statusValidationResult = 'FAILED';
    }
    input.requestId = uuidv4();
    formatLogger(
      this.logger,
      'info',
      `Starting update onboarding state for onboardingSessionId *${input.onboardingSessionId}* into MSA_CO_ONBOARDING_STATUS`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    const updateData: OnboardingStatusUpdateRequestDto = {
      status: 'SUCCESS',
      data: {
        onboardingSessionId: onboardingSessionId,
        statusResultValidation: statusValidationResult,
        comment: 'Document validation started',
      },
    };

    await this.updateOnboardingStateUseCase.execute(updateData, 'cnb-document');

    formatLogger(
      this.logger,
      'info',
      `Finished updating onboarding state for onboardingSessionId *${input.onboardingSessionId}* into MSA_CO_ONBOARDING_STATUS`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    input.requestId = uuidv4();
    const queueData = {
      scanReference: respValidationDocument.scanReference,
      type: 'cnb-document',
      onboardingSessionId: onboardingSessionId,
      sessionId: input.sessionId,
      trackingId: input.trackingId,
      requestId: input.requestId,
    };

    formatLogger(
      this.logger,
      'info',
      `Starting publish document validation queue for onboardingSessionId *${input.onboardingSessionId}*`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    await this.publishDocumentValidationQueueUseCase.execute(queueData);

    formatLogger(
      this.logger,
      'info',
      `Completed publish document validation queue for onboardingSessionId *${input.onboardingSessionId}*`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    return {
      statusValidation: statusValidationResult,
    };
  }

  /**
   * Process the messages received from the document validation queue
   * @param message The message received from the Kafka queue
   * @param trackingInfo Tracking information (trackingId, sessionId, requestId)
   */
  async processDocumentValidationMessage(
    message: any,
    trackingInfo: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<{
    retry?: boolean;
    status?: string;
    message?: any;
    data?: DocumentValidationDataResultDto;
  }> {
    const { trackingId, sessionId, requestId } = trackingInfo;

    formatLogger(
      this.logger,
      'info',
      `Starting processing documentId validation into MSA_TL_KYC for onboardingSessionId ${message.sessionId}`,
      sessionId,
      trackingId,
      requestId,
    );

    // Use the use case instead of calling the client directly
    const respValidationStatus =
      await this.getDocumentValidationStatusUseCase.execute(
        message.scanReference,
        trackingInfo,
      );
    let requestIdQueue = uuidv4();
    // If the status is PENDING, return for retry and implement auto-retry
    if (respValidationStatus.status === DocumentValidationStatus.PENDING) {
      formatLogger(
        this.logger,
        'info',
        `Document validation is *PENDING*, returning message to be processed again for onboardingSessionId *${message.onboardingSessionId}*`,
        sessionId,
        trackingId,
        requestIdQueue,
      );

      // Schedule the auto-retry directly from the service
      const retryCount = message.retryCount || 0;
      const retryRequestId = uuidv4();

      setTimeout(async () => {
        try {
          const retryMessage = {
            ...message,
            requestId: retryRequestId,
            retryCount: retryCount + 1,
            timestamp: new Date().toISOString(),
          };

          formatLogger(
            this.logger,
            'info',
            `Document validation is *PENDING*, executing auto-retry scheduled #${retryCount + 1} for onboardingSessionId *${message.onboardingSessionId}*`,
            sessionId,
            trackingId,
            requestIdQueue,
          );

          // Recursive call to retry
          await this.processDocumentValidationMessage(retryMessage, {
            requestId: retryRequestId,
            sessionId,
            trackingId,
          });
        } catch (error) {
          formatLogger(
            this.logger,
            'error',
            `Document validation, error in auto-retry: ${error.message} for onboardingSessionId *${message.onboardingSessionId}*`,
            sessionId,
            trackingId,
            requestIdQueue,
          );

          // In case of error, schedule another retry after more time
          setTimeout(async () => {
            const errorRetryMessage = {
              ...message,
              requestId: requestIdQueue,
              retryCount: retryCount + 1,
              timestamp: new Date().toISOString(),
            };

            await this.processDocumentValidationMessage(errorRetryMessage, {
              requestId: requestIdQueue,
              sessionId,
              trackingId,
            });
          }, this.retryDelayMs);
        }
      }, this.retryDelayMs);

      // Return the original message so the controller knows to retry
      return { retry: true, message };
    }

    let statusResult = respValidationStatus.status;
    let documentData: DocumentValidationDataResultDto;
    requestIdQueue = uuidv4();
    try {
      formatLogger(
        this.logger,
        'info',
        `Starting to get document data, for onboardingSessionId *${message.onboardingSessionId}*, from MSA_TL_KYC`,
        sessionId,
        trackingId,
        requestIdQueue,
      );
      // Get detailed document data for msa-tl-kyc
      documentData = await this.getDocumentValidationDataUseCase.execute(
        message.scanReference,
        trackingInfo,
      );

      formatLogger(
        this.logger,
        'info',
        `Finished getting document data, for onboardingSessionId *${message.onboardingSessionId}*, from MSA_TL_KYC`,
        sessionId,
        trackingId,
        requestIdQueue,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error getting document data, for onboardingSessionId *${message.onboardingSessionId}*, from MSA_TL_KYC: ${error.message}`,
        sessionId,
        trackingId,
        requestIdQueue,
      );
      statusResult = DocumentValidationStatus.FAILED;
    }

    let finalResult = statusResultValidationDocument.FAILED;
    // If the status is DONE, get the document data
    if (
      respValidationStatus?.status === DocumentValidationStatus.DONE &&
      documentData?.status === DocumentValidationResultStatus.APPROVED_VERIFIED
    ) {
      finalResult = statusResultValidationDocument.DONE;
    }

    // Update onboarding status with the final result
    requestIdQueue = uuidv4();

    const updateData: OnboardingStatusUpdateRequestDto = {
      status: 'SUCCESS',
      data: {
        onboardingSessionId: message.onboardingSessionId,
        statusResultValidation: finalResult,
        comment: `Document validation ${statusResult.toLowerCase()}`,
      },
    };

    // If we have document data, add it as additional information
    if (documentData) {
      // Use Object.assign to avoid type errors
      Object.assign(updateData.data, { documentData });
    }
    try {
      formatLogger(
        this.logger,
        'info',
        `Starting to update onboarding status by onboardingSessionId *${message.onboardingSessionId}*, status: ${finalResult}, into MSA_CO_ONBOARDING_STATUS`,
        sessionId,
        trackingId,
        requestIdQueue,
      );
      await this.updateOnboardingStateUseCase.execute(
        updateData,
        'cnb-document',
      );

      formatLogger(
        this.logger,
        'info',
        `Finished updating onboarding status by onboardingSessionId *${message.onboardingSessionId}*, into MSA_CO_ONBOARDING_STATUS`,
        sessionId,
        trackingId,
        requestIdQueue,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error updating onboarding status by onboardingSessionId *${message.onboardingSessionId}*, into MSA_CO_ONBOARDING_STATUS: ${error.message}`,
        sessionId,
        trackingId,
        requestIdQueue,
      );
    }

    // Indicates that the processing was successful and does not need to be retried
    return {
      retry: false,
      status: statusResult,
      data: documentData,
    };
  }
}
