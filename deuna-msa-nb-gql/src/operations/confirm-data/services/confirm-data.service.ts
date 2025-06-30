import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfirmDataInputDto } from '../dto/confirm-data-input.dto';
import {
  UpdateDataOnboardingResponseDto,
  GetStateOnboardingResponseDto,
  ConfirmDataResponseDto,
} from '../dto/confirm-data-response.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { UpdateDataOboardingInputDto } from 'src/external-services/msa-nb-configuration/dto/msa-nb-configuration-input.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ISaveElectronicSignatureResponseRedis } from '../dto/confirm-data-response.dto';
import {
  IMsaNbCnbOrqService,
  MSA_NB_CNB_ORQ_SERVICE,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { formatAddress } from '../../../utils/format-address.util';

@Injectable()
export class ConfirmDataService {
  private readonly logger = new Logger(ConfirmDataService.name);
  private readonly CONTEXT = 'confirm-data';

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStateService: IMsaCoOnboardingStatusService,
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly msaNbCnbOrqService: IMsaNbCnbOrqService,
  ) {}

  /**
   * Creates a standardized error object
   */
  private createError(code: string, message: string, details?: any): Error {
    return new Error(JSON.stringify({ code, message, details }));
  }

  /**
   * Validates a required field and throws an error if invalid
   */
  private validateRequiredField(
    value: any,
    fieldName: string,
    errorCode: string,
  ): void {
    if (!value) {
      throw this.createError(errorCode, `${fieldName} is required`);
    }
  }

  /**
   * Validates a response from an external service
   */
  private validateServiceResponse(
    response: any,
    errorCode: string,
    errorMessage: string,
  ): void {
    if (!response) {
      throw this.createError(errorCode, errorMessage);
    }
  }

  /**
   * Handles service operation with error management
   */
  private async handleServiceOperation<T>(
    operation: () => Promise<T>,
    errorCode: string,
    errorMessage: string,
  ): Promise<T> {
    try {
      const result = await operation();
      this.validateServiceResponse(result, errorCode, errorMessage);
      return result;
    } catch (error) {
      if (error instanceof Error && this.isCustomError(error)) {
        throw error;
      }
      throw this.createError(errorCode, errorMessage, error);
    }
  }

  /**
   * Checks if an error is a custom error with code
   */
  private isCustomError(error: Error): boolean {
    try {
      const parsed = JSON.parse(error.message);
      return !!parsed.code;
    } catch {
      return false;
    }
  }

  private async prepareDataSignElectronic(
    input: ConfirmDataInputDto,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    const { city, province, address } = formatAddress(input.establishment);
    return await this.msaNbCnbOrqService.updateElectronicSign(
      {
        identificationNumber: input.identificationNumber,
        city,
        province,
        address,
      },
      {
        sessionId: input.sessionId,
        trackingId: input.trackingId,
        requestId: input.requestId,
      },
    );
  }

  async startConfirmData(
    input: ConfirmDataInputDto,
  ): Promise<ConfirmDataResponseDto> {
    try {
      this.validateInput(input);

      const onboardingStateResponse = await this.getOnboardingState(input);
      this.validateStateOnboarding(onboardingStateResponse);

      const updateOboardingState = await this.updateOnboardingState(input);
      this.validateServiceResponse(
        updateOboardingState,
        ErrorCodes.ONB_STEP_INVALID,
        'Failed to update onboarding state',
      );

      const updateSignElectronic = await this.prepareDataSignElectronic(input);

      if (!updateSignElectronic) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.REDIS_UPDATE_ERROR,
            message:
              'Failed to update electronic signature request data in msa-nb-cnb-orq',
          },
          'start-onboarding',
        );
      }

      return {
        onboardingSessionId: input.onboardingSessionId,
        status: 'SUCCESS',
      };
    } catch (error) {
      if (error instanceof Error && this.isCustomError(error)) {
        const parsedError = JSON.parse(error.message);
        return ErrorHandler.handleError(parsedError, this.CONTEXT);
      }
      return ErrorHandler.handleError(
        {
          code: ErrorCodes.SYS_PROCESS_FAILED,
          message: 'Unexpected error during confirm data process',
          details: error,
        },
        this.CONTEXT,
      );
    }
  }

  private async getOnboardingState(
    input: ConfirmDataInputDto,
  ): Promise<GetStateOnboardingResponseDto> {
    const response = await this.handleServiceOperation(
      async () =>
        lastValueFrom(
          this.msaCoOnboardingStateService.getOnboardingState(
            input.onboardingSessionId,
          ),
        ),
      ErrorCodes.ONB_GET_SESSION_FAIL,
      'Failed to retrieve onboarding state',
    );

    return {
      ...response,
      onboardingSessionId: response.sessionId,
    };
  }

  private async updateOnboardingState(
    input: ConfirmDataInputDto,
  ): Promise<UpdateDataOnboardingResponseDto> {
    const dataUpdateOnboarding: UpdateDataOboardingInputDto = {
      sessionId: input.onboardingSessionId,
      status: 'SUCCESS',
      data: {
        establishment: {
          fullAddress: input.establishment.fullAddress,
          numberEstablishment: input.establishment.numberEstablishment,
        },
      },
    };

    return this.handleServiceOperation(
      async () => {
        return lastValueFrom(
          this.msaCoOnboardingStateService.updateOnboardingState(
            dataUpdateOnboarding,
            this.CONTEXT,
          ),
        );
      },
      ErrorCodes.ONB_STEP_INVALID,
      'Failed to update onboarding state',
    );
  }

  private validateStateOnboarding(
    dataOboardingState: GetStateOnboardingResponseDto,
  ): void {
    this.validateRequiredField(
      dataOboardingState,
      'Onboarding state',
      ErrorCodes.ONB_STATUS_INVALID,
    );

    if (
      !dataOboardingState.data ||
      typeof dataOboardingState.data !== 'object'
    ) {
      throw this.createError(
        ErrorCodes.ONB_DATA_INCOMPLETE,
        'Invalid onboarding state data structure',
      );
    }

    this.validateRequiredField(
      dataOboardingState.data['start-onb-cnb'],
      'start-onb-cnb data',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
  }

  private validateInput(input: ConfirmDataInputDto): void {
    this.validateRequiredField(
      input,
      'Input data',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
    this.validateRequiredField(
      input.onboardingSessionId,
      'Session ID',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
    this.validateRequiredField(
      input.establishment,
      'Establishment data',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
    this.validateRequiredField(
      input.establishment.fullAddress,
      'Establishment full address',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
    this.validateRequiredField(
      input.establishment.numberEstablishment,
      'Establishment number',
      ErrorCodes.ONB_DATA_INCOMPLETE,
    );
  }
}
