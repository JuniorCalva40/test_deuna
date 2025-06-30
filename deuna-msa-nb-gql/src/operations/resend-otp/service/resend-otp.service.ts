import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ResendOtpInput, ResendOtpResponse } from '../dto/resend-otp.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';

interface AcceptContractData {
  businessDeviceId: string;
  deviceName: string;
  commerceName: string;
  email: string;
  requestId: string;
  notificationChannel: string[];
}

@Injectable()
export class ResendOtpService {
  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_CO_AUTH_SERVICE)
    private readonly msaCoAuthService: IMsaCoAuthService,
  ) {}

  async resendOtp(input: ResendOtpInput): Promise<ResendOtpResponse> {
    try {
      const getOnboardingState = await lastValueFrom(
        this.msaCoOnboardingStatusService.getOnboardingState(input.sessionId),
      );

      if (!getOnboardingState) {
        return ErrorHandler.handleError(
          ErrorCodes.ONB_SESSION_EXPIRED,
          'resend-otp',
        );
      }

      const acceptContractData = getOnboardingState.data['accept-contract'];

      if (
        Object.keys(getOnboardingState.data).length !== 4 ||
        acceptContractData.status !== 'SUCCESS'
      ) {
        return ErrorHandler.handleError(
          ErrorCodes.ONB_STATUS_INVALID,
          'resend-otp',
        );
      }

      this.validateGenerateOtpFields(acceptContractData);

      const otpResponse = await lastValueFrom(
        this.msaCoAuthService.generateOtp({
          businessDeviceId: acceptContractData.businessDeviceId,
          deviceName: acceptContractData.deviceName,
          commerceName: acceptContractData.commerceName,
          email: acceptContractData.email,
          requestId: acceptContractData.requestId,
          notificationChannel: acceptContractData.notificationChannel,
        }),
      );

      if (!otpResponse) {
        return ErrorHandler.handleError(
          ErrorCodes.AUTH_OTP_INVALID,
          'resend-otp',
        );
      }

      return {
        message: 'OTP resent successfully',
        expirationDate: otpResponse.expirationDate,
        remainingResendAttempts: otpResponse.remainingResendAttempts,
        status: 'SUCCESS',
      };
    } catch (error) {
      if (error instanceof Error) {
        return ErrorHandler.handleError(error, 'resend-otp');
      } else {
        return ErrorHandler.handleError(
          ErrorCodes.SYS_ERROR_UNKNOWN,
          'resend-otp',
        );
      }
    }
  }

  validateGenerateOtpFields(data: AcceptContractData) {
    if (
      !data.businessDeviceId ||
      !data.deviceName ||
      !data.commerceName ||
      !data.email ||
      !data.requestId ||
      !data.notificationChannel
    ) {
      return ErrorHandler.handleError(
        ErrorCodes.ONB_DATA_INCOMPLETE,
        'resend-otp',
      );
    }
  }
}
