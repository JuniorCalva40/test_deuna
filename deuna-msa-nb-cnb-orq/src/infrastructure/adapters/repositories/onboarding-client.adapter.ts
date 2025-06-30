import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OnboardingClientPort } from '../../../application/ports/out/clients/onboarding-client.port';
import { GetStateOnboardingResponseDto } from '../../../application/dto/onboarding/get-state-onboarding-response.dto';
import { OnboardingStatusUpdateRequestDto } from '../../../application/dto/onboarding/onboarding-status-update-request.dto';
import { OnboardingStatusUpdateResponseDto } from '../../../application/dto/onboarding/onboarding-status-update-response.dto';

/**
 * Adapter implementation for onboarding client
 * Responsible for communicating with the onboarding status microservice
 */
@Injectable()
export class OnboardingClientAdapter implements OnboardingClientPort {
  private readonly logger = new Logger(OnboardingClientAdapter.name);
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      'MSA_CO_ONBOARDING_STATUS_URL',
    );
    if (!this.apiUrl) {
      throw new Error('MSA_CO_ONBOARDING_STATUS_URL is not defined');
    }
  }

  /**
   * Get onboarding state by session ID
   * @param onboardingSessionId The onboarding session ID to get the state for
   * @returns The onboarding state response
   */
  async getOnboardingState(
    onboardingSessionId: string,
  ): Promise<GetStateOnboardingResponseDto> {
    const fullUrl = `${this.apiUrl}/status/session/${onboardingSessionId}`;
    this.logger.log(`Calling onboarding status service: ${fullUrl}`);

    try {
      return await firstValueFrom(
        this.httpService.get<GetStateOnboardingResponseDto>(fullUrl).pipe(
          map((response) => response.data),
          catchError((error) => {
            this.logger.error(
              'Error received from onboarding status service: ',
              error,
            );
            throw error;
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Error in onboarding client: ${error.message}`,
        error.stack,
      );
      throw new Error(`Onboarding service error: ${error.message}`);
    }
  }

  /**
   * Update onboarding state for a specific step
   * @param updateData The data to update the onboarding state
   * @param step The step to update
   * @returns The updated onboarding state response
   */
  async updateOnboardingState(
    updateData: OnboardingStatusUpdateRequestDto,
    step: string,
  ): Promise<OnboardingStatusUpdateResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${updateData.data.onboardingSessionId}/${step}`;
    this.logger.log(`Updating onboarding step ${step}: ${fullUrl}`);
    try {
      return await firstValueFrom(
        this.httpService
          .patch<OnboardingStatusUpdateResponseDto>(fullUrl, updateData)
          .pipe(
            map((response) => response.data),
            catchError((error) => {
              this.logger.error(
                `Error updating onboarding state for step ${step}: `,
                error,
              );
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.logger.error(
        `Error in onboarding client: ${error.message}`,
        error.stack,
      );
      throw new Error(`Onboarding service error: ${error.message}`);
    }
  }
}
