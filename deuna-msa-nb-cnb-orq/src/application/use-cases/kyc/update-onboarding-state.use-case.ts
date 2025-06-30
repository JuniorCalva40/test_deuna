import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OnboardingClientPort,
  ONBOARDING_CLIENT_PORT,
} from '@src/application/ports/out/clients/onboarding-client.port';
import { OnboardingStatusUpdateRequestDto } from '@src/application/dto/onboarding/onboarding-status-update-request.dto';
import { OnboardingStatusUpdateResponseDto } from '@src/application/dto/onboarding/onboarding-status-update-response.dto';

/**
 * Use case for updating onboarding state
 * Single responsibility: Update a specific step status in onboarding state
 */
@Injectable()
export class UpdateOnboardingStateUseCase {
  private readonly logger = new Logger(UpdateOnboardingStateUseCase.name);

  constructor(
    @Inject(ONBOARDING_CLIENT_PORT)
    private readonly onboardingClient: OnboardingClientPort,
  ) {}

  /**
   * Updates the onboarding state for a specific step
   * @param updateData The data to update the onboarding state
   * @param step The step to update
   * @returns The updated onboarding state response
   */
  async execute(
    updateData: OnboardingStatusUpdateRequestDto,
    step: string,
  ): Promise<OnboardingStatusUpdateResponseDto> {
    this.logger.log(
      `Updating onboarding step ${step} for session: ${updateData.data.onboardingSessionId}`,
    );

    try {
      const result = await this.onboardingClient.updateOnboardingState(
        updateData,
        step,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating onboarding state: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
