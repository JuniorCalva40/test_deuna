class InfoTributariaDto {
  razonSocial: string;

  nombreComercial: string;

  ruc: string;

  codigoDocumento: string;

  establecimiento: string;

  puntoEmision: string;

  secuencial: string;

  direccionMatriz: string;
}

class TotalConImpuestosDto {
  codigo: number;

  codigoPorcentaje: number;

  baseImponible: number;

  valor: number;
}

class PagoDto {
  total: number;
}

class DetalleDto {
  precioUnitario: number;

  descuento: number;

  precioTotalSinImpuesto: number;

  tarifa: number;

  baseImponible: number;

  valor: number;
}

class InfoAdicionalDto {
  descripcion: string;
}

class InfoFacturaDto {
  contribuyenteEspecial?: string;

  totalSinImpuestos: number;

  totalDescuento: number;

  totalConImpuestos: TotalConImpuestosDto[];

  importeTotal: number;

  pagos: PagoDto[];
}

export class CreateInvoiceRequestDto {
  infoTributaria: InfoTributariaDto;

  infoFactura: InfoFacturaDto;

  detalles: DetalleDto[];

  infoAdicional?: InfoAdicionalDto[];
}
