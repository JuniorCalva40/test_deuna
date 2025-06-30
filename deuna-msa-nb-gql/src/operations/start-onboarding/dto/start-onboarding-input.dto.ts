import { InputType } from '@nestjs/graphql';
import { TrackingBaseDto } from '../../../common/constants/common';

@InputType()
export class StartOnboardingInput extends TrackingBaseDto {
  identification: string;
  email: string;
  id: string;
  username: string;
  businessName: string;
  applicantName: string;
  applicantLastName: string;
  phoneNumber: string;
}

export interface AdditDto {
  estado: string;
  matriz: string;
  direccionCompleta: string;
  tipoEstablecimiento: string;
  numeroEstablecimiento: string;
  nombreFantasiaComercial: string;
}

export interface MerchantDataInput {
  identification: string;
  id: string;
  fullName: string;
  principalContact: string;
  ruc?: {
    result: {
      razonSocial: string;
      numeroRuc: string;
      estadoContribuyenteRuc?: string;
      actividadEconomicaPrincipal?: string;
      tipoContribuyente?: string;
      regimen?: string;
      categoria?: string;
      obligadoLlevarContabilidad?: string;
      agenteRetencion?: string;
      contribuyenteEspecial?: string;
      informacionFechasContribuyente: {
        fechaInicioActividades?: string;
        fechaCese?: string;
        fechaReinicioActividades?: string;
        fechaActualizacion?: string;
      };
      representantesLegales?: string;
      motivoCancelacionSuspension?: string;
      contribuyenteFantasma?: string;
      transaccionesInexistente?: string;
      addit: Array<{
        nombreFantasiaComercial?: string;
        tipoEstablecimiento?: string;
        estado: string;
        direccionCompleta: string;
        numeroEstablecimiento: string;
      }>;
    };
  };
}
