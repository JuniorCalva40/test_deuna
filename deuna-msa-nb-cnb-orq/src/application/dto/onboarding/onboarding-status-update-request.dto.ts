/**
 * DTO for onboarding status update request
 */
export class OnboardingStatusUpdateRequestDto {
  status: string;
  data: {
    onboardingSessionId: string;
    statusResultValidation: string;
    comment?: string;
  };
}
