export class Establishment {
  fullAddress: string;
  numberEstablishment: string;
}

export class RucRepresentanteLegal {
  nombre: string;
  identificacion: string;
}

export class RucFechas {
  fechaCese: string;
  fechaActualizacion: string;
  fechaInicioActividades: string;
  fechaReinicioActividades: string;
}

export class RucEstablishment {
  estado: string;
  matriz: string;
  direccionCompleta: string;
  tipoEstablecimiento: string;
  numeroEstablecimiento: string;
  nombreFantasiaComercial: string;
}

export class RucDetails {
  result: {
    addit: RucEstablishment[];
    regimen: string;
    categoria: string | null;
    numeroRuc: string;
    razonSocial: string;
    agenteRetencion: string;
    tipoContribuyente: string;
    contribuyenteEspecial: string;
    contribuyenteFantasma: string;
    representantesLegales: RucRepresentanteLegal[];
    estadoContribuyenteRuc: string;
    transaccionesInexistente: string;
    obligadoLlevarContabilidad: string;
    actividadEconomicaPrincipal: string;
    motivoCancelacionSuspension: string | null;
    informacionFechasContribuyente: RucFechas;
  };
}

export class CommerceResponseDto {
  id: string;
  name: string;
  fullName: string;
  principalContact: string;
  username: string;
  identification: string;
  ruc?: RucDetails;
}
