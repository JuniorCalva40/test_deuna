/**
 * DTO for onboarding status update response
 */
export class OnboardingStatusUpdateResponseDto {
  successSteps: string[];
  requiredSteps: string[];
  optionalSteps: string[];
  failureSteps: string[];
  successIdentityValidationSteps: string[];
  standbyIdentityValidationSteps: string[];
  processingFailure: string[];
  status: string;
  onbType: string;
}
