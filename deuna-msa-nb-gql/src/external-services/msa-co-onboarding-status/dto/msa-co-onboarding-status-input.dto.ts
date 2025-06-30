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
  ruc: RucDataInputDto;
  fullName: string;
  commerceId?: string;
  username: string;
  establishment: EstablishmentInputDto[];
  email: string;
  cnbClientId?: string;
  phoneNumber?: string;
  trackingId: string;
}

export class RucDataInputDto {
  rucNumber: string;
  estadoContribuyenteRuc: string;
  actividadEconomicaPrincipal: string;
  tipoContribuyente: string;
  regimen: string;
  categoria: string;
  obligadoLlevarContabilidad: string;
  agenteRetencion: string;
  contribuyenteEspecial: string;
  informacionFechasContribuyente: RucTaxPayerDataInputDto;
  addit: Array<{
    nombreFantasiaComercial?: string;
    tipoEstablecimiento?: string;
    estado: string;
    direccionCompleta: string;
    numeroEstablecimiento: string;
  }>;
}

export class RucTaxPayerDataInputDto {
  fechaInicioActividades: string;
  fechaCese: string;
  fechaReinicioActividades: string;
  fechaActualizacion: string;
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
  sessionId: string;
  status: string;
}

export class FingeprintCodeInputDto {
  sessionId: string;
  status: string;
  data: FingeprintCodeDataInputDto;
}

export class FingeprintCodeDataInputDto {
  nationalID: string;
  fingerprintData: string;
}

export class DocumentValidationInputDto {
  sessionId: string;
  status: string;
  data: DocumentValidationDataInputDto;
}

export class DocumentValidationDataInputDto {
  frontsideImage?: string;
  backsideImage?: string;
  scanReference: string;
  timestamp: string;
  type: string;
}
