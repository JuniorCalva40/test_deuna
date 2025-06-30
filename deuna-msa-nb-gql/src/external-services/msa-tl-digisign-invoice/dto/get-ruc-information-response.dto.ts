class Addit {
  nombreFantasiaComercial: string;
  numeroEstablecimiento: string;
  tipoEstablecimiento: string;
  direccionCompleta: string;
  estado: string;
  matriz: string;
}

class RepresentanteLegal {
  representanteLegal: string;
  identificacionLegal: string;
}

class InformacionFechasContribuyente {
  fechaInicioActividades: string;
  fechaCese: string;
  fechaReinicioActividades: string;
  fechaActualizacion: string;
}

class Main {
  numeroRuc: string;
  razonSocial: string;
  estadoContribuyenteRuc: string;
  actividadEconomicaPrincipal: string;
  tipoContribuyente: string;
  regimen: string;
  categoria: string;
  obligadoLlevarContabilidad: string;
  agenteRetencion: string;
  contribuyenteEspecial: string;
  informacionFechasContribuyente: InformacionFechasContribuyente;
  representantesLegales: RepresentanteLegal[];
  motivoCancelacionSuspension: string;
  contribuyenteFantasma: string;
  transaccionesInexistente: string;
  addit: Addit[];
}

class Data {
  main: Main[];
}

export class GetRucInformationResponseDto {
  data: Data;
}
