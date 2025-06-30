import { DataStateCnb } from '../../msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { EstablishmentOutputDto } from '../../../utils/establishment.dto';

class OnboardingResponseBase {
  status: string;

  onbType: string;
}

export class ConfirmDataResponseDto extends OnboardingResponseBase {
  successSteps: string[];

  requiredSteps: string[];

  optionalSteps: string[];

  failureSteps: string[];

  successIdentityValidationSteps: string[];

  standbyIdentityValidationSteps: string[];

  processingFailure: string[];
}

export class GetStateOnboardingResponseDto extends OnboardingResponseBase {
  id?: number;

  sessionId: string;

  securitySeed: string;

  identityId: string;

  data: DataStateCnb;

  publicKey: string;

  createdAt: Date;

  updatedAt: Date;
}

export class DataConfigurationResponse {
  id: string;

  configKey: string;

  configData: EstablishmentOutputDto;

  cnbClientId: string;

  enabled: boolean;
}
