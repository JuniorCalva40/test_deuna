import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  ConfirmDataInputDto,
  DataConfigurationInputDto,
} from '../dto/confirm-data-input.dto';
import {
  UpdateDataOnboardingResponseDto,
  GetStateOnboardingResponseDto,
  ConfirmDataResponseDto,
} from '../dto/confirm-data-response.dto';
import { MSA_NB_CONFIGURATION_SERVICE } from '../../../external-services/msa-nb-configuration/providers/msa-nb-configuration-provider';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaNbConfigurationService } from '../../../external-services/msa-nb-configuration/interfaces/msa-nb-configuration-service.interface';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { UpdateDataOboardingInputDto } from 'src/external-services/msa-nb-configuration/dto/msa-nb-configuration-input.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
/**
 * Service responsible for confirming data.
 */
@Injectable()
export class ConfirmDataService {
  private readonly logger = new Logger(ConfirmDataService.name);
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 segundo

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStateService: IMsaCoOnboardingStatusService,
    @Inject(MSA_NB_CONFIGURATION_SERVICE)
    private readonly msaNbConfigurationService: IMsaNbConfigurationService,
  ) {}

  /**
   * Starts the confirm data process.
   *
   * @param input - The input for the confirm data process.
   * @returns A promise that resolves to a ConfirmDataResponseDto.
   */
  async startConfirmData(
    input: ConfirmDataInputDto,
  ): Promise<ConfirmDataResponseDto> {
    try {
      const onboardingStateResponse = await this.getOnboardingState(input);

      if (!this.validateStateOnboarding(onboardingStateResponse)) {
        return ErrorHandler.handleError(
          `El estado [confirm-data] ya fue ejecutado para el sessionId: ${input.sessionId}`,
          'confirm-data',
        );
      }

      const cnbClientId =
        onboardingStateResponse.data['start-onb-cnb'].data.cnbClientId;

      await this.saveDataConfiguration(input, cnbClientId);

      const updateOboardingState = await this.updateOnboardingState(input);

      if (!updateOboardingState) {
        return ErrorHandler.handleError(
          `Error al actualizar el estado del onboarding para el sessionId: ${input.sessionId}`,
          'confirm-data',
        );
      }

      const response: ConfirmDataResponseDto = {
        cnbClientId: cnbClientId,
        sessionId: input.sessionId,
        status: 'SUCCESS',
      };

      return response;
    } catch (error) {
      return ErrorHandler.handleError(error, 'confirm-data');
    }
  }

  /**
   * Retrieves the onboarding state using the provided input.
   *
   * @param input - The input for retrieving the onboarding state.
   * @returns A promise that resolves to the onboarding state response.
   */
  private async getOnboardingState(
    input: ConfirmDataInputDto,
  ): Promise<GetStateOnboardingResponseDto> {
    return lastValueFrom(
      this.msaCoOnboardingStateService.getOnboardingState(input.sessionId),
    );
  }

  /**
   * Saves the data configuration.
   *
   * @param input - The input for saving the data configuration.
   * @returns A promise that resolves when the data configuration is saved successfully.
   */
  private async saveDataConfiguration(
    input: ConfirmDataInputDto,
    cnbClientId: string,
  ): Promise<void> {
    const dataConfiguration: DataConfigurationInputDto = {
      configKey: 'establishment',
      configData: input.establishment,
      cnbClientId: cnbClientId,
      updatedBy: 'system',
      createdBy: 'system',
    };

    await lastValueFrom(
      this.msaNbConfigurationService.saveDataConfiguration(dataConfiguration),
    );
  }

  /**
   * Updates the onboarding state with the provided input.
   *
   * @param input - The input data for updating the onboarding state.
   * @returns A promise that resolves to the response of updating the onboarding state.
   */
  private async updateOnboardingState(
    input: ConfirmDataInputDto,
  ): Promise<UpdateDataOnboardingResponseDto> {
    const dataUpdateOnboarding: UpdateDataOboardingInputDto = {
      sessionId: input.sessionId,
      status: 'SUCCESS',
      data: {
        establishment: {
          fullAddress: input.establishment.fullAddress,
          numberEstablishment: input.establishment.numberEstablishment,
        },
      },
    };

    return lastValueFrom(
      this.msaCoOnboardingStateService.updateOnboardingState(
        dataUpdateOnboarding,
        'confirm-data',
      ),
    );
  }

  /**
   * Validates the state of onboarding data.
   *
   * @param dataOboardingState - The onboarding data state to validate.
   * @returns A boolean indicating whether the state is valid or not.
   */
  private validateStateOnboarding(
    dataOboardingState: GetStateOnboardingResponseDto,
  ): boolean {
    if (
      !dataOboardingState ||
      typeof dataOboardingState !== 'object' ||
      !('data' in dataOboardingState)
    ) {
      return false;
    }

    const { data } = dataOboardingState;
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    return true;
  }
}
