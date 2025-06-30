import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OnboardingClientPort,
  ONBOARDING_CLIENT_PORT,
} from '@src/application/ports/out/clients/onboarding-client.port';
import { GetStateOnboardingResponseDto } from '@src/application/dto/onboarding/get-state-onboarding-response.dto';

/**
 * Use case for getting onboarding state
 * Single responsibility: Retrieve onboarding state from onboarding microservice
 */
@Injectable()
export class GetOnboardingStateUseCase {
  private readonly logger = new Logger(GetOnboardingStateUseCase.name);

  constructor(
    @Inject(ONBOARDING_CLIENT_PORT)
    private readonly onboardingClient: OnboardingClientPort,
  ) {}

  /**
   * Get onboarding state for a session
   * @param sessionId The session ID to get the state for
   * @returns The onboarding state response
   */
  async execute(sessionId: string): Promise<GetStateOnboardingResponseDto> {
    this.logger.log(`Getting onboarding state for sessionId: ${sessionId}`);

    try {
      const result = await this.onboardingClient.getOnboardingState(sessionId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting onboarding state: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
