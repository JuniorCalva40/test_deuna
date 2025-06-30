import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  StartBiometricValidationInputDto,
  BiometricValidationBody,
} from '../dto/start-biometric-validation-input.dto';
import {
  StartBiometricValidationResponseDto,
  ISaveElectronicSignatureResponseRedis,
} from '../dto/start-biometric-validation-response.dto';
import {
  IMsaNbCnbOrqService,
  MSA_NB_CNB_ORQ_SERVICE,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { formatLogger } from '../../../utils/format-logger';
import { Logger } from '@deuna/tl-logger-nd';
import { ErrorCodes } from '../../../common/constants/error-codes';
@Injectable()
export class StartBiometricValidationService {
  private readonly logger = new Logger({
    context: StartBiometricValidationService.name,
  });
  private readonly CONTEXT = 'start-biometric-validation';

  constructor(
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly msaNbCnbOrqService: IMsaNbCnbOrqService,
  ) {}

  private async prepareDataSignElectronic(
    input: StartBiometricValidationInputDto,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    return await this.msaNbCnbOrqService.updateElectronicSign(
      {
        identificationNumber: input.identificationNumber,
        fileIdentificationSelfie: input.facialAndLivenessValidation.token1,
      },
      {
        sessionId: input.sessionId,
        trackingId: input.trackingId,
        requestId: input.requestId,
      },
    );
  }

  async startBiometricValidation(
    input: StartBiometricValidationInputDto,
  ): Promise<StartBiometricValidationResponseDto> {
    try {
      formatLogger(
        this.logger,
        'info',
        `Starting liveness and facial validation for onboardingSessionId: ${input.onboardingSessionId} into msa-nb-cnb-orq`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      const biometricInput: BiometricValidationBody = {
        facialAndLivenessValidation: {
          token1: input.facialAndLivenessValidation.token1,
          token2: input.facialAndLivenessValidation.token2,
          method: input.facialAndLivenessValidation.method,
        },
        onboardingSessionId: input.onboardingSessionId,
      };

      const result = await lastValueFrom(
        this.msaNbCnbOrqService.startBiometricValidation(biometricInput, {
          sessionId: input.sessionId,
          trackingId: input.trackingId,
          requestId: input.requestId,
        }),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-nb-cnb-orq startBiometricValidation for onboardingSessionId: ${input.onboardingSessionId}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error in biometric validation into msa-nb-cnb-orq for onboardingSessionId: ${input.onboardingSessionId}',
          ErrorCodes.DOCUMENT_VALIDATION_CNB_ORQ_DOCUMENT_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished biometric validation for onboardingSessionId: ${input.onboardingSessionId} in msa-nb-cnb-orq`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      const updateElectronicSignatureResponse =
        await this.prepareDataSignElectronic(input);

      if (!updateElectronicSignatureResponse) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.REDIS_UPDATE_ERROR,
            message:
              'Failed to update electronic signature request data in msa-nb-cnb-orq',
          },
          'start-biometric-validation',
        );
      }

      const response: StartBiometricValidationResponseDto = {
        scanId: result.scanId,
        status: 'SUCCESS',
      };

      return response;
    } catch (error) {
      throw ErrorHandler.handleError(error, this.CONTEXT);
    }
  }
}
