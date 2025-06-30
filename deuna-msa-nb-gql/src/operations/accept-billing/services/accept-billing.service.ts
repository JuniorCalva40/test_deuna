import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AcceptBillingInput } from '../dto/accept-billing-input.dto';
import { UpdateDataOnboardingInputDto } from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-input.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import {
  GetStateOnboardingResponse,
  AcceptBillingResponse,
} from '../dto/accept-billing-response.dto';
import { UpdateDataOnboardingResponseDto } from 'src/operations/confirm-data/dto/confirm-data-response.dto';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Service responsible for accept billing.
 */
@Injectable()
export class AcceptBillingService {
  private readonly ONBOARDING_STEP = 'accept-billing';

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStateService: IMsaCoOnboardingStatusService,
  ) {}

  /**
   * Starts the accept billing process.
   *
   * @param input - The input for the accept billing process.
   * @returns A promise that resolves to a AcceptBillingResponse.
   */
  async startAcceptBilling(
    input: AcceptBillingInput,
  ): Promise<AcceptBillingResponse> {
    try {
      const onboardingStateResponse = await this.getOnboardingState(input);

      if (!onboardingStateResponse) {
        return ErrorHandler.handleError(
          ErrorCodes.ONB_DATA_INCOMPLETE,
          'accept-billing',
        );
      }

      if (this.validateStateOnboarding(onboardingStateResponse)) {
        return ErrorHandler.handleError(
          `${ErrorCodes.ONB_STEP_INVALID}: El estado [accept-billing] ya fue ejecutado para el sessionId: ${input.sessionId}`,
          'accept-billing',
        );
      }

      const updateOnboardingState = await this.updateOnboardingState(input);

      if (!updateOnboardingState) {
        return ErrorHandler.handleError(
          ErrorCodes.ONB_STATUS_INVALID,
          'accept-billing',
        );
      }

      const acceptBillingData: AcceptBillingResponse = {
        sessionId: input.sessionId,
        status: 'SUCCESS',
      };

      return acceptBillingData;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validates the state of onboarding data.
   *
   * @param dataOboardingState - The onboarding data state to validate.
   * @returns A boolean indicating whether the state is valid or not.
   */
  private validateStateOnboarding(
    dataOboardingState: GetStateOnboardingResponse,
  ): boolean {
    if (!dataOboardingState || typeof dataOboardingState !== 'object') {
      return false;
    }

    const { data } = dataOboardingState;
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const dataKeys = Object.keys(data);
    if (
      dataKeys.length !== 1 ||
      !['accept-billing', 'acceptBilling'].includes(dataKeys[0])
    ) {
      return false;
    }

    return true;
  }

  /**
   * Retrieves the onboarding state using the provided input.
   *
   * @param input - The input for retrieving the onboarding state.
   * @returns A promise that resolves to the onboarding state response.
   */
  private async getOnboardingState(
    input: AcceptBillingInput,
  ): Promise<GetStateOnboardingResponse> {
    try {
      return await lastValueFrom(
        this.msaCoOnboardingStateService.getOnboardingState(input.sessionId),
      );
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Updates the onboarding state with the provided input.
   *
   * @param input - The input data for updating the onboarding state.
   * @returns A promise that resolves to the response of updating the onboarding state.
   */
  private async updateOnboardingState(
    input: AcceptBillingInput,
  ): Promise<UpdateDataOnboardingResponseDto> {
    const dataUpdateOnboarding: UpdateDataOnboardingInputDto = {
      sessionId: input.sessionId,
      status: 'SUCCESS',
      data: {
        textosFacturacion: ['mock-input-bill', 'test-bill'],
      },
    };

    try {
      return await lastValueFrom(
        this.msaCoOnboardingStateService.updateOnboardingState(
          dataUpdateOnboarding,
          this.ONBOARDING_STEP,
        ),
      );
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Manages errors in a centralized manner.
   *
   * @param error - The error to handle.
   * @returns An AcceptBillingResponse object with the corresponding error.
   */
  private handleError(error: any): AcceptBillingResponse {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return ErrorHandler.handleError(
          ErrorCodes.SYS_TIMEOUT_EXCEEDED,
          'accept-billing',
        );
      } else if (error.message.includes('network')) {
        return ErrorHandler.handleError(
          ErrorCodes.SYS_SERVICE_DOWN,
          'accept-billing',
        );
      }
    }
    return ErrorHandler.handleError(
      ErrorCodes.SYS_ERROR_UNKNOWN,
      'accept-billing',
    );
  }
}
