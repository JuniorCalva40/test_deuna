export class McBoRepresentanteLegalDto {
  representanteLegal: string;
  identificacionLegal: string;
}

export class McBoInformacionFechasContribuyenteDto {
  fechaCese: string;
  fechaActualizacion: string;
  fechaInicioActividades: string;
  fechaReinicioActividades: string;
}

export class McBoAdditDto {
  estado: string;
  matriz: string;
  direccionCompleta: string;
  tipoEstablecimiento: string;
  numeroEstablecimiento: string;
  nombreFantasiaComercial: string;
}

export class McBoConfigDataDto {
  addit: McBoAdditDto[];
  regimen: string;
  categoria: string;
  numeroRuc: string;
  razonSocial: string;
  agenteRetencion: string;
  tipoContribuyente: string;
  contribuyenteEspecial: string;
  contribuyenteFantasma: string;
  representantesLegales: McBoRepresentanteLegalDto[];
  estadoContribuyenteRuc: string;
  transaccionesInexistente: string;
  obligadoLlevarContabilidad: string;
  actividadEconomicaPrincipal: string;
  motivoCancelacionSuspension: string;
  informacionFechasContribuyente: McBoInformacionFechasContribuyenteDto;
}

export class McBoConfigCnbAddressDto {
  id: string;
  nodeId: string;
  configName: string;
  configData: McBoConfigDataDto;
  clientType: string;
  encrypted: boolean;
}
