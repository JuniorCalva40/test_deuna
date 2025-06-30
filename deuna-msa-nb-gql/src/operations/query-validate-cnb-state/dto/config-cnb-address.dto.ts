export class RepresentanteLegalDto {
  representanteLegal: string;
  identificacionLegal: string;
}

export class InformacionFechasContribuyenteDto {
  fechaCese: string;
  fechaActualizacion: string;
  fechaInicioActividades: string;
  fechaReinicioActividades: string;
}

export class AdditDto {
  estado: string;
  matriz: string;
  direccionCompleta: string;
  tipoEstablecimiento: string;
  numeroEstablecimiento: string;
  nombreFantasiaComercial: string;
}

export class ConfigDataDto {
  addit: AdditDto[];
  regimen: string;
  categoria: string;
  numeroRuc: string;
  razonSocial: string;
  agenteRetencion: string;
  tipoContribuyente: string;
  contribuyenteEspecial: string;
  contribuyenteFantasma: string;
  representantesLegales: RepresentanteLegalDto[];
  estadoContribuyenteRuc: string;
  transaccionesInexistente: string;
  obligadoLlevarContabilidad: string;
  actividadEconomicaPrincipal: string;
  motivoCancelacionSuspension: string;
  informacionFechasContribuyente: InformacionFechasContribuyenteDto;
}

export class ConfigCnbAddressDto {
  id: string;
  nodeId: string;
  configName: string;
  configData: ConfigDataDto;
  clientType: string;
  encrypted: boolean;
}
