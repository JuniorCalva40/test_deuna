import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import {
  ResendOtpInput,
  ResendOtpResponse,
  ClientInfoResp,
} from '../dto/resend-otp.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { IMsaNbClientService } from '../../../external-services/msa-nb-cnb-service/interfaces/msa-nb-client-service.interface';
import { PreApprovedState } from '../../../common/constants/common';

interface AcceptContractData {
  businessDeviceId: string;
  deviceName: string;
  commerceName: string;
  email: string;
  requestId: string;
}

@Injectable()
export class ResendOtpService {
  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_CO_AUTH_SERVICE)
    private readonly msaCoAuthService: IMsaCoAuthService,
    @Inject(MSA_NB_CLIENT_SERVICE)
    private readonly msaNbClientService: IMsaNbClientService,
  ) {}

  async resendOtp(input: ResendOtpInput): Promise<ResendOtpResponse> {
    try {
      const clientId = await this.validateClientStatus(
        input.onboardingSessionId,
      );

      const getOnboardingState = await lastValueFrom(
        this.msaCoOnboardingStatusService.getOnboardingState(
          input.onboardingSessionId,
        ),
      );

      if (!getOnboardingState) {
        return ErrorHandler.handleError(
          ErrorCodes.ONB_GET_SESSION_FAIL,
          'resend-otp',
        );
      }

      const acceptContractData = getOnboardingState.data['accept-contract'];

      if (!acceptContractData || acceptContractData.status !== 'SUCCESS') {
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
        }),
      );

      if (!otpResponse) {
        return ErrorHandler.handleError(
          ErrorCodes.AUTH_OTP_INVALID,
          'resend-otp',
        );
      }
      if (otpResponse.remainingResendAttempts === 0) {
        await this.updateClientStatus(clientId);
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
      !data.requestId
    ) {
      return ErrorHandler.handleError(
        ErrorCodes.ONB_DATA_INCOMPLETE,
        'resend-otp',
      );
    }
  }

  private async validateClientStatus(sessionId: string): Promise<string> {
    const response = await lastValueFrom(
      this.msaCoOnboardingStatusService.getClientDataFromStartOnboardingState(
        sessionId,
      ) as Observable<ClientInfoResp>,
    );

    if (response.status === PreApprovedState.BLOCKED_TMP) {
      ErrorHandler.handleError(
        'Client is temporarily blocked by the OTP',
        ErrorCodes.CLIENT_BLOCKED_TMP_OTP,
      );
    }

    return response.cnbClientId;
  }

  private async updateClientStatus(clientId: string): Promise<void> {
    await lastValueFrom(
      this.msaNbClientService.updateClientStatus({
        clientId,
        status: PreApprovedState.BLOCKED_TMP,
      }),
    );
  }
}
