import { DataStateCnb } from './data-state-cnb.dto';

/**
 * DTO for onboarding state response
 */
export class GetStateOnboardingResponseDto {
  id?: number;
  sessionId: string;
  securitySeed: string;
  identityId: string;
  onbType: string;
  data: DataStateCnb;
  status: string;
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
}
