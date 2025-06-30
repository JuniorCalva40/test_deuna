import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import {
  ValidateOtpInputDto,
  ValidateOtpResponseDto,
  ClientDataResp,
} from '../dto/validate-otp.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { IMsaNbClientService } from '../../../external-services/msa-nb-cnb-service/interfaces/msa-nb-client-service.interface';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { PreApprovedState } from '../../../common/constants/common';
@Injectable()
export class ValidateOtpService {
  private readonly logger = new Logger(ValidateOtpService.name);

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_CO_AUTH_SERVICE)
    private readonly msaMiAuthService: IMsaCoAuthService,
    @Inject(MSA_NB_CLIENT_SERVICE)
    private readonly msaNbClientService: IMsaNbClientService,
  ) {}

  async validateOtp(
    input: ValidateOtpInputDto,
  ): Promise<ValidateOtpResponseDto> {
    this.validateInputParameters(input);
    const clientId = await this.validateClientStatus(input.onboardingSessionId);
    try {
      const validateOtpResult = await await lastValueFrom(
        this.msaMiAuthService.validateOtp(
          input.businessDeviceId,
          input.requestId,
          input.otp,
        ),
      );

      if (!validateOtpResult || validateOtpResult.status !== 'SUCCESS') {
        if (validateOtpResult.remainingVerifyAttempts === 0) {
          await this.updateClientStatusTemporaryBlocked(clientId);
        }
        return {
          status: 'ERROR',
          isVerifiedOtp: false,
          otpResponse: {
            message: validateOtpResult?.message || 'OTP validation failed',
            remainingResendAttempts: validateOtpResult?.remainingVerifyAttempts,
          },
          errors: [
            {
              code: ErrorCodes.AUTH_OTP_VALIDATION_FAILED,
              message: validateOtpResult?.message || 'Invalid OTP provided',
            },
          ],
        };
      }

      try {
        await this.updateOtpStatus(input);
      } catch (updateError) {
        return {
          status: 'ERROR',
          isVerifiedOtp: false,
          otpResponse: {
            message: updateError.message,
            remainingResendAttempts: undefined,
          },
          errors: [
            {
              code: ErrorCodes.AUTH_OTP_UPDATE_FAILED,
              message: updateError.message,
            },
          ],
        };
      }

      return {
        status: 'SUCCESS',
        isVerifiedOtp: true,
        otpResponse: {
          message: 'OTP validation successful',
        },
      };
    } catch (error) {
      if (error.remainingVerifyAttempts === 0) {
        await this.updateClientStatusTemporaryBlocked(clientId);
      }
      this.logger.error(`OTP validation failed: ${error.message}`, error.stack);

      return {
        status: 'ERROR',
        isVerifiedOtp: false,
        otpResponse: {
          message: error.message,
          remainingResendAttempts: error.remainingVerifyAttempts,
        },
        errors: [
          {
            code: error.code || ErrorCodes.AUTH_OTP_VALIDATION_FAILED,
            message: error.message,
          },
        ],
      };
    }
  }

  private validateInputParameters(input: ValidateOtpInputDto): void {
    if (!input || !input.otp || input.otp.length !== 6) {
      ErrorHandler.handleError(
        'Invalid OTP format - Must be 6 digits',
        ErrorCodes.AUTH_OTP_REQUEST_INVALID,
      );
    }

    if (
      !input.onboardingSessionId ||
      !input.businessDeviceId ||
      !input.requestId
    ) {
      const missingFields = [];
      if (!input.onboardingSessionId) missingFields.push('onboardingSessionId');
      if (!input.businessDeviceId) missingFields.push('businessDeviceId');
      if (!input.requestId) missingFields.push('requestId');

      ErrorHandler.handleError(
        `Missing required parameters: ${missingFields.join(', ')}`,
        ErrorCodes.AUTH_OTP_REQUEST_INVALID,
      );
    }
  }

  private async updateOtpStatus(input: ValidateOtpInputDto): Promise<void> {
    try {
      const response = await lastValueFrom(
        this.msaCoOnboardingStatusService.setStepValidateOtp(
          input.onboardingSessionId,
          input.otp,
        ),
      );

      if (!response) {
        ErrorHandler.handleError(
          'Failed to update OTP status in onboarding state',
          ErrorCodes.AUTH_OTP_UPDATE_FAILED,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update OTP status: ${error.message}`,
        error.stack,
      );
      ErrorHandler.handleError(
        'Error updating OTP status in onboarding state',
        ErrorCodes.AUTH_OTP_UPDATE_FAILED,
      );
    }
  }

  private async validateClientStatus(sessionId: string): Promise<string> {
    const response = await lastValueFrom(
      this.msaCoOnboardingStatusService.getClientDataFromStartOnboardingState(
        sessionId,
      ) as Observable<ClientDataResp>,
    );

    if (response.status === PreApprovedState.BLOCKED_TMP) {
      ErrorHandler.handleError(
        'Client is temporarily blocked by the OTP',
        ErrorCodes.CLIENT_BLOCKED_TMP_OTP,
      );
    }

    return response.cnbClientId;
  }

  private async updateClientStatusTemporaryBlocked(
    clientId: string,
  ): Promise<void> {
    await lastValueFrom(
      this.msaNbClientService.updateClientStatus({
        clientId,
        status: PreApprovedState.BLOCKED_TMP,
        blockedTmpAt: new Date().toISOString(),
      }),
    );
  }
}
