import { Type } from 'class-transformer';
import { EstablishmentInputDto } from '../../../utils/establishment.dto';

export class DataConfigurationInputDto {
  configKey: string;

  configData: EstablishmentInputDto;

  cnbClientId: string;

  updatedBy: string;

  createdBy: string;
}

export class InitOnboardingInputDto {
  identityId: string;

  onbType: string;

  securitySeed: string;

  publicKey: string;
}

export class DataUpdateOnboardingAcceptBillingInputDto {
  establishment?: EstablishmentInputDto;

  textosFacturacion?: string[];
}

export class DataUpdateOnboardingSignContractInputDto {
  status: string;
}

export class UpdateDataOnboardingInputDto {
  sessionId: string;
  status: string;
  data:
    | DataUpdateOnboardingAcceptBillingInputDto
    | DataUpdateOnboardingSignContractInputDto;
}

export class DataStartOnboardingInputDto {
  companyName: string;

  ruc: number;

  fullName: string;

  establishment: EstablishmentInputDto[];

  email: string;

  cnbClientId: string;

  phoneNumber: string;
}

export class StartOnboardingInputDto {
  sessionId: string;

  status: string;

  @Type(() => DataStartOnboardingInputDto)
  data: DataStartOnboardingInputDto;
}

export class SetStepAcceptContractInputDto {
  requestId: string;

  email: string;

  deviceName: string;

  commerceName: string;

  notificationChannel: string[];
  sessionId: string;

  status: string;
}
