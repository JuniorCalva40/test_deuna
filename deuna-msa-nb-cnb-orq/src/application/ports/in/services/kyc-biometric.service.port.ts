import { FacialValidationDto } from '../../../dto/facial-validation.dto';
import { LivenessValidationDto } from '../../../dto/liveness-validation.dto';
import { KycResponseDto } from '../../../dto/kyc-response.dto';

export const KYC_PORT = 'KYC_PORT' as const;

export interface KycBiometricValidationServicePort {
  startBiometricValidation(
    facialValidation: FacialValidationDto,
    livenessValidation: LivenessValidationDto,
    onboardingSessionId: string,
    sessionId: string,
    trackingId: string,
  ): Promise<KycResponseDto>;
}
