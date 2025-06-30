import { Injectable, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { IMsaCoCommerceService } from '../interfaces/msa-co-commerce-service.interface';
import { DocumentInputDto } from '../dto/msa-co-commerce-input.dto';
import { CommerceResponseDto } from '../dto/msa-co-commerce-response.dto';

@Injectable()
export class FakeRestMsaCoCommerceService implements IMsaCoCommerceService {
  private readonly logger = new Logger(FakeRestMsaCoCommerceService.name);

  getUserByDocument(input: DocumentInputDto): Observable<CommerceResponseDto> {
    this.logger.log(
      `Fake getUserByDocument called with identification: ${input.identification}`,
    );

    // Simulate API call delay
    return of({ id: `MERCH-${input.identification}` }).pipe(
      delay(500), // Simulate network delay
      map((apiData) => {
        // Simulate transforming API response
        const transformedData: CommerceResponseDto = {
          id: apiData.id,
          name: 'XYZ Corporation',
          ruc: {
            result: {
              addit: [
                {
                  estado: 'ABIERTO',
                  matriz: 'SI',
                  direccionCompleta:
                    'GUAYAS / GUAYAQUIL / TARQUI / VICTOR EMILIO ESTRADA 706-B Y FICUS',
                  tipoEstablecimiento: 'MAT',
                  numeroEstablecimiento: '001',
                  nombreFantasiaComercial: 'PAGOS & FACTURAS',
                },
                {
                  estado: 'CERRADO',
                  matriz: 'NO',
                  direccionCompleta:
                    'GUAYAS / GUAYAQUIL / GUAYAQUIL / FICUS 706-B Y VICTOR EMILIO ESTRADA',
                  tipoEstablecimiento: 'OFI',
                  numeroEstablecimiento: '002',
                  nombreFantasiaComercial: 'ACCROACHCODE',
                },
              ],
              regimen: 'GENERAL',
              categoria: null,
              numeroRuc: '1579501139001',
              razonSocial: 'ACCROACHCODE S.A.',
              agenteRetencion: 'NO',
              tipoContribuyente: 'SOCIEDAD',
              contribuyenteEspecial: 'NO',
              contribuyenteFantasma: 'NO',
              representantesLegales: [
                {
                  nombre: 'BUITRON CARRASCO GUSTAVO ENRIQUE',
                  identificacion: '1579501139',
                },
              ],
              estadoContribuyenteRuc: 'ACTIVO',
              transaccionesInexistente: 'NO',
              obligadoLlevarContabilidad: 'SI',
              actividadEconomicaPrincipal:
                'ACTIVIDADES DE PLANIFICACIÓN Y DISEÑO DE SISTEMAS INFORMÁTICOS QUE INTEGRAN EQUIPO Y PROGRAMAS INFORMÁTICOS Y TECNOLOGÍA DE LAS COMUNICACIONES.',
              motivoCancelacionSuspension: null,
              informacionFechasContribuyente: {
                fechaCese: '',
                fechaActualizacion: '2020-01-24 15:33:05.0',
                fechaInicioActividades: '2014-10-08 00:00:00.0',
                fechaReinicioActividades: '',
              },
            },
          },
          fullName: 'John Doe',
          principalContact: '1234567890',
          username: 'test-username',
          identification: input.identification,
        };

        return transformedData;
      }),
    );
  }

  getUserByUsername(input: string): Observable<CommerceResponseDto> {
    throw new Error('Method not implemented.' + input);
  }
}
