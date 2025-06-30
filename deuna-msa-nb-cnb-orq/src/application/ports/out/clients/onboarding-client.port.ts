import { GetStateOnboardingResponseDto } from '@src/application/dto/onboarding/get-state-onboarding-response.dto';
import { OnboardingStatusUpdateRequestDto } from '@src/application/dto/onboarding/onboarding-status-update-request.dto';
import { OnboardingStatusUpdateResponseDto } from '@src/application/dto/onboarding/onboarding-status-update-response.dto';

/**
 * Port for onboarding state client operations
 */
export interface OnboardingClientPort {
  /**
   * Get onboarding state by session ID
   * @param sessionId The session ID to get the state for
   * @returns The onboarding state response
   */
  getOnboardingState(sessionId: string): Promise<GetStateOnboardingResponseDto>;

  /**
   * Update onboarding state for a specific step
   * @param updateData The data to update the onboarding state
   * @param step The step to update
   * @returns The updated onboarding state response
   */
  updateOnboardingState(
    updateData: OnboardingStatusUpdateRequestDto,
    step: string,
  ): Promise<OnboardingStatusUpdateResponseDto>;
}

/**
 * Token for onboarding client port dependency injection
 */
export const ONBOARDING_CLIENT_PORT = 'ONBOARDING_CLIENT_PORT';
