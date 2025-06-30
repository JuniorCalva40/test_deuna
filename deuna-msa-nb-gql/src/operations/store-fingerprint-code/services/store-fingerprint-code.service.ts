import { Injectable, Inject, Logger } from '@nestjs/common';
import { FingeprintCodeInputDto } from '../dto/fingerprint-code-input.dto';
import { FingeprintCodeResponseDto } from '../dto/fingerprint-code-response.dto';
import { lastValueFrom } from 'rxjs';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ISaveElectronicSignatureResponseRedis } from '../dto/fingerprint-code-response.dto';
import {
  IMsaNbCnbOrqService,
  MSA_NB_CNB_ORQ_SERVICE,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';

@Injectable()
export class StoreFingeprintCodeService {
  private readonly logger = new Logger(StoreFingeprintCodeService.name);

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly msaNbCnbOrqService: IMsaNbCnbOrqService,
  ) {}

  /**
   * Validate the required fields and throw an error if they are invalid
   */
  private validateRequiredField(
    value: any,
    fieldName: string,
    errorCode: string,
  ): void {
    if (!value) {
      throw ErrorHandler.handleError(
        {
          code: errorCode,
          message: `${fieldName} is required`,
        },
        'store-fingerprint-code',
      );
    }
  }

  private async prepareDataSignElectronic(
    input: FingeprintCodeInputDto,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    return await this.msaNbCnbOrqService.updateElectronicSign(
      {
        identificationNumber: input.identificationNumber,
        fingerCode: input.fingerprintData,
      },
      {
        sessionId: input.sessionId,
        trackingId: input.trackingId,
        requestId: input.requestId,
      },
    );
  }

  /**
   * Class for storing the information of the identification number
   * and the fingerprint code of the user during the onboarding process for CNB
   *
   * @param input
   * @returns
   */
  async storeFingeprintCode(
    input: FingeprintCodeInputDto,
  ): Promise<FingeprintCodeResponseDto> {
    try {
      this.validateInput(input);

      // Registra el step fingerprint en la máquina de estados
      const storeFingerprintCodeResponse = await lastValueFrom(
        this.msaCoOnboardingStatusService.setFingerprintStep({
          sessionId: input.onboardingSessionId,
          status: 'SUCCESS',
          data: {
            nationalID: input.nationalID,
            fingerprintData: input.fingerprintData,
          },
        }),
      );

      if (!storeFingerprintCodeResponse) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.FINGERPRINT_ERROR,
            message: 'Failed to store fingerprint code',
          },
          'store-fingerprint-code',
        );
      }

      const updateElectronicSignatureResponse =
        await this.prepareDataSignElectronic(input);
      if (!updateElectronicSignatureResponse) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.REDIS_SAVE_ERROR,
            message:
              'Failed to update electronic signature request data in msa-nb-cnb-orq',
          },
          'store-fingerprint-code',
        );
      }

      const fingeprintCodeRespDto: FingeprintCodeResponseDto = {
        status: 'SUCCESS',
        message: '',
      };

      return fingeprintCodeRespDto;
    } catch (error) {
      this.logger.error('store-fingerprint-code');
      return ErrorHandler.handleError(error, 'store-fingerprint-code');
    }
  }

  /**
   * Executes the validation of the required input fields
   * @param input
   */
  private validateInput(input: FingeprintCodeInputDto): void {
    this.validateRequiredField(
      input.onboardingSessionId,
      'Session ID',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
    this.validateRequiredField(
      input.fingerprintData,
      'Fingerprint Data',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
    this.validateRequiredField(
      input.nationalID,
      'National ID',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
  }
}
