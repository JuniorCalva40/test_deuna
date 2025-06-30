import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { QueryOnboardingStatusDto } from '../dto/query-onboarding-status.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { findMissingStrings } from '../../../utils/string-comparator.util'; // Importamos la nueva función

@Injectable()
export class QueryOnboardingStatusService {
  private readonly logger = new Logger(QueryOnboardingStatusService.name);

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
  ) {}

  async getOnboardingStatus(
    sessionId: string,
  ): Promise<QueryOnboardingStatusDto> {
    try {
      const onboardingState = await lastValueFrom(
        this.msaCoOnboardingStatusService.getOnboardingState(sessionId),
      );

      if (!onboardingState) {
        return ErrorHandler.handleError(
          `Failed to retrieve onboarding status for sessionId: ${sessionId}`,
          'query-onboarding-status',
        );
      }
      const transformedData: string[] = Object.keys(onboardingState.data);

      if (transformedData.length === 0) {
        return ErrorHandler.handleError(
          `Failed to retrieve onboarding status for sessionId: ${sessionId}`,
          'query-onboarding-status',
        );
      }

      // Aplicamos la función findMissingStrings y guardamos el resultado
      const requiredSteps = findMissingStrings(transformedData);

      const transformedState: QueryOnboardingStatusDto = {
        data: transformedData,
        status: 'SUCCESS',
        requiredSteps: requiredSteps, // Añadimos requiredSteps al objeto de retorno
      };

      return transformedState;
    } catch (error) {
      return ErrorHandler.handleError(error, 'query-onboarding-status');
    }
  }
}
