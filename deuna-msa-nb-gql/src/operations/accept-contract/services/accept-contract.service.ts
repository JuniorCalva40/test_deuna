import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom, catchError } from 'rxjs';
import {
  AcceptContractDataResponseDto,
  GenerateOtpRespDto,
} from '../dto/accept-contract-response.dto';
import {
  AcceptContractDataInputDto,
  GenerateOtpInputDto,
} from '../dto/accept-contract-input.dto';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import { GetStateOnboardingResponseDto } from '../../../operations/confirm-data/dto/confirm-data-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { maskEmail } from '../../../utils/email-masker.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { IMsaNbClientService } from '../../../external-services/msa-nb-cnb-service/interfaces/msa-nb-client-service.interface';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { PreApprovedState } from '../../../common/constants/common';
import { UpdateClientCnbInput } from '../dto/update-client-cnb.input.dto';

@Injectable()
export class AcceptContractService {
  private readonly logger = new Logger(AcceptContractService.name);
  private commerceName: string;

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStateService: IMsaCoOnboardingStatusService,
    @Inject(MSA_CO_AUTH_SERVICE)
    private readonly msaCoAuthService: IMsaCoAuthService,
    @Inject(MSA_NB_CLIENT_SERVICE)
    private cnbClientServiceNb: IMsaNbClientService,
  ) {}

  private async updateClientCnbStatus(
    clientId: string,
    remainingAttempts: number,
  ): Promise<void> {
    remainingAttempts = remainingAttempts - 1;
    let status = PreApprovedState.REMAINING;
    if (remainingAttempts === 0) {
      status = PreApprovedState.BLOCKED_PERMANENT;
    }

    const input: UpdateClientCnbInput = {
      clientId,
      status,
      remainingAttemptsOnb: remainingAttempts,
    };

    try {
      await lastValueFrom(this.cnbClientServiceNb.updateClientStatus(input));
    } catch (error) {
      this.logger.error(
        `Error updating remaining attempts client status: ${error.message}`,
      );
      this.handleError(
        'Error updating remaining attempts client-cnb status',
        ErrorCodes.CNB_SERVICE_ERROR,
      );
    }
  }

  private handleError(message: string, errorCode: string): never {
    this.logger.error(`Error: ${message}`);
    return ErrorHandler.handleError(message, errorCode);
  }

  async startAcceptContract(
    input: AcceptContractDataInputDto,
    email: string,
    identification: string,
  ): Promise<AcceptContractDataResponseDto> {
    try {
      await this.getAndValidateOnboardingState(input, identification);
      const requestId = uuidv4();
      const otpResponse = await this.sendOtp(input, requestId, email);

      if (!otpResponse) {
        return this.handleError(
          'Error sending OTP',
          ErrorCodes.NOTIF_SEND_FAILED,
        );
      }

      this.logger.log(
        `OTP sent successfully for onboardingSessionId: ${input.onboardingSessionId} and requestId: ${requestId}`,
      );

      const bodyUpdateOnboardingState = {
        requestId: requestId,
        email: email,
        deviceName: input.deviceName,
        commerceName: this.commerceName,
        sessionId: input.onboardingSessionId,
        businessDeviceId: input.businessDeviceId,
      };

      const bodyUpdateOnboardingStateWithStatus = {
        ...bodyUpdateOnboardingState,
        status: 'PENDING',
      };

      const updateOnboardingState = await lastValueFrom(
        this.msaCoOnboardingStateService.setStepAcceptContract(
          bodyUpdateOnboardingStateWithStatus,
        ),
      );

      if (!updateOnboardingState) {
        return this.handleError(
          'Error updating onboarding state',
          ErrorCodes.ONB_STATUS_INVALID,
        );
      }

      const response: AcceptContractDataResponseDto = {
        onboardingSessionId: input.onboardingSessionId,
        requestId: requestId,
        otpResponse: otpResponse,
        email: maskEmail(email),
        status: 'SUCCESS',
      };

      return response;
    } catch (error) {
      return this.handleError(error.message, ErrorCodes.SYS_ERROR_UNKNOWN);
    }
  }

  private async getAndValidateOnboardingState(
    input: AcceptContractDataInputDto,
    identification: string,
  ): Promise<void> {
    const response = await lastValueFrom(
      this.msaCoOnboardingStateService
        .getOnboardingState(input.onboardingSessionId)
        .pipe(
          catchError((error) =>
            this.handleError(error.message, ErrorCodes.ONB_GET_SESSION_FAIL),
          ),
        ),
    );

    if (!response.data) {
      return this.handleError(
        'Invalid onboarding state: missing information for the session',
        ErrorCodes.ONB_DATA_INCOMPLETE,
      );
    }

    const cnbClient = await lastValueFrom(
      this.cnbClientServiceNb
        .getClientByIdentification(identification)
        .pipe(
          catchError((error) =>
            this.handleError(error.message, ErrorCodes.CNB_SERVICE_ERROR),
          ),
        ),
    );

    if (!cnbClient) {
      return this.handleError(
        'Invalid onboarding state: cnb-client not found',
        ErrorCodes.CNB_CLIENT_NOT_FOUND,
      );
    }

    const remainingAttemptsOnb = cnbClient.remainingAttemptsOnb;

    const onboardingStateResponse = {
      ...response,
      onboardingSessionId: response.sessionId,
    };

    this.validateOnboardingStateErrors(
      onboardingStateResponse,
      remainingAttemptsOnb,
      cnbClient.id,
    );
  }

  private async sendOtp(
    data: AcceptContractDataInputDto,
    requestId: string,
    email: string,
  ): Promise<GenerateOtpRespDto> {
    const otpRequest: GenerateOtpInputDto = {
      businessDeviceId: data.businessDeviceId,
      requestId: requestId,
      email: email,
      deviceName: data.deviceName,
      commerceName: this.commerceName,
    };

    return lastValueFrom(
      this.msaCoAuthService
        .generateOtp(otpRequest)
        .pipe(
          catchError((error) =>
            this.handleError(error.message, ErrorCodes.NOTIF_SEND_FAILED),
          ),
        ),
    );
  }

  private validateOnboardingStateErrors(
    onboardingState: GetStateOnboardingResponseDto,
    remainingAttemptsOnb: number,
    clientId: string,
  ): void {
    if (!onboardingState) {
      this.handleError(
        'The onboarding state is invalid',
        ErrorCodes.ONB_STATUS_INVALID,
      );
    }
    const states = onboardingState.data;
    const requiredSteps = [
      'start-onb-cnb',
      'confirm-data',
      'cnb-facial',
      'cnb-liveness',
      'cnb-document',
    ];

    for (const step of requiredSteps) {
      if (!states[step] || states[step].status !== 'SUCCESS') {
        return this.handleError(
          `Invalid onboarding state: the ${step} step has not been completed successfully`,
          ErrorCodes.ONB_STEP_INVALID,
        );
      }
    }

    if (remainingAttemptsOnb <= 0) {
      return this.handleError(
        'Client cnb is blocked permanently, remaining attempts onboarding is 0',
        ErrorCodes.ONB_BLOCKED_PERMANENTLY,
      );
    }

    this.commerceName = onboardingState.data['start-onb-cnb'].data.fullName;

    const cnbResultValidation =
      onboardingState.data['cnb-document'].data.statusResultValidation;
    if (cnbResultValidation === 'PENDING') {
      return this.handleError(
        'Invalid onboarding state: the validation document step has not been completed successfully',
        ErrorCodes.ONB_VALIDATE_DOCUMENT_ID_PENDING,
      );
    }

    if (cnbResultValidation !== 'FINALIZED_OK') {
      this.updateClientCnbStatus(clientId, remainingAttemptsOnb);

      return this.handleError(
        'Invalid onboarding state: the validation document step has not been completed successfully',
        ErrorCodes.ONB_VALIDATE_IDENTITY_ID_FAILED,
      );
    }

    const cnbFacialResultValidation =
      onboardingState.data['cnb-facial'].data.statusResultValidation;
    if (cnbFacialResultValidation !== 'FINALIZED_OK') {
      this.updateClientCnbStatus(clientId, remainingAttemptsOnb);

      return this.handleError(
        'Invalid onboarding state: the validation facial step has not been completed successfully',
        ErrorCodes.ONB_VALIDATE_IDENTITY_ID_FAILED,
      );
    }

    const cnbLivenessResultValidation =
      onboardingState.data['cnb-liveness'].data.statusResultValidation;
    if (cnbLivenessResultValidation !== 'FINALIZED_OK') {
      this.updateClientCnbStatus(clientId, remainingAttemptsOnb);

      return this.handleError(
        'Invalid onboarding state: the validation identity step has not been completed successfully',
        ErrorCodes.ONB_VALIDATE_IDENTITY_ID_FAILED,
      );
    }
  }
}
