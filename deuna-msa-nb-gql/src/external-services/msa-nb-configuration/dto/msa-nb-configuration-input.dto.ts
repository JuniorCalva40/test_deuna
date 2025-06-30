import { Type } from 'class-transformer';
import { EstablishmentInputDto } from '../../../utils/establishment.dto';
export class ConfirmDataInputDto {
  sessionId: string;

  @Type(() => EstablishmentInputDto)
  establishment: EstablishmentInputDto;

  cnbClientId: string;
}

export class DataConfigurationInputDto {
  configKey: string;

  configData: EstablishmentInputDto;

  cnbClientId: string;

  updatedBy: string;

  createdBy: string;
}

export class UpdateDataOboardingInputDto {
  sessionId: string;

  status: string;

  data: any;
}
