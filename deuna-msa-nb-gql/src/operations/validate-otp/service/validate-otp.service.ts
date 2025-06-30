import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import {
  ValidateOtpInputDto,
  ValidateOtpResponseDto,
  DataGenerateOtpRespDto,
} from '../dto/validate-otp.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';

@Injectable()
export class ValidateOtpService {
  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_CO_AUTH_SERVICE)
    private readonly msaMiAuthService: IMsaCoAuthService,
  ) {}

  async validateOtp(
    input: ValidateOtpInputDto,
  ): Promise<ValidateOtpResponseDto> {
    try {
      const validateOtpResponse = await lastValueFrom(
        this.msaMiAuthService.validateOtp(
          input.businessDeviceId,
          input.requestId,
          input.otp,
        ),
      );

      if (validateOtpResponse.status !== 'SUCCESS') {
        return ErrorHandler.handleError(
          `Failed to validate OTP: ${validateOtpResponse.message}`,
          'validate-otp',
        );
      }

      const updateOtpStatusResponse = await lastValueFrom(
        this.msaCoOnboardingStatusService.setStepValidateOtp(
          input.sessionId,
          input.otp,
        ),
      );

      if (!updateOtpStatusResponse) {
        return ErrorHandler.handleError(
          `Invalid onboarding state: error updating OTP status for sessionId: ${input.sessionId}`,
          'validate-otp',
        );
      }

      const otpResponse: DataGenerateOtpRespDto = {
        message: 'validate-otp success',
      };

      return {
        status: 'SUCCESS',
        isVerifiedOtp: true,
        otpResponse,
      };
    } catch (error) {
      return {
        status: 'ERROR',
        isVerifiedOtp: false,
        otpResponse: {
          message: error.message,
          remainingResendAttempts: error.remainingVerifyAttempts,
        },
      };
    }
  }
}
