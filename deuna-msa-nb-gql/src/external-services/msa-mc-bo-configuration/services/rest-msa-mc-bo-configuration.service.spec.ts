import { Test, TestingModule } from '@nestjs/testing';
import { RestMsaMcBoConfigurationService } from './rest-msa-mc-bo-configuration.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { GetNodeConfigResponse } from '../dto/get-node-config-response';
import { McBoConfigCnbAddressDto } from '../dto/get-config-cnb-address.dto';

describe('RestMsaMcBoConfigurationService', () => {
  let service: RestMsaMcBoConfigurationService;
  let configServiceMock: jest.Mocked<ConfigService>;
  let httpServiceMock: jest.Mocked<HttpService>;

  beforeEach(async () => {
    // Configurar el mock de ConfigService para devolver una URL base válida
    configServiceMock = {
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'MSA_MC_BO_CONFIGURATION_SERVICE_URL') {
          return 'http://mock-api';
        }
        return defaultValue;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    httpServiceMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaMcBoConfigurationService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    service = module.get<RestMsaMcBoConfigurationService>(
      RestMsaMcBoConfigurationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfigCnbState', () => {
    it('should return config data for node id and config code NB001', (done) => {
      // Mock de la respuesta del servicio
      const mockResponse: Partial<GetNodeConfigResponse> = {
        id: 'config-123',
        nodeId: 'node-123',
        configName: 'NB001',
        configData: { status: 'ACTIVE' },
        clientType: 'COMMERCE' as any,
      };

      // Mock de la respuesta HTTP
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      httpServiceMock.get.mockReturnValue(of(axiosResponse));

      // Ejecutar el método
      service.getConfigCnbState('node-123').subscribe({
        next: (response) => {
          expect(httpServiceMock.get).toHaveBeenCalledWith(
            'http://mock-api/configuration/node-123/search/NB001',
          );
          expect(response).toEqual(mockResponse);
          done();
        },
        error: (error) => {
          done.fail(error);
        },
      });
    });

    it('should throw an error when the HTTP request fails', (done) => {
      // Mock del error HTTP
      const errorMessage = 'Network error';
      httpServiceMock.get.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      // Ejecutar el método
      service.getConfigCnbState('node-123').subscribe({
        next: () => {
          done.fail('Expected an error but got a successful response');
        },
        error: (error) => {
          expect(error.message).toContain(
            'Error getting node configuration: Network error',
          );
          done();
        },
      });
    });
  });

  describe('getConfigCnbAddress', () => {
    it('should return config data for node id and config code CO002', (done) => {
      // Mock de la respuesta del servicio
      const mockResponse: McBoConfigCnbAddressDto = {
        id: 'config-456',
        nodeId: 'node-123',
        configName: 'CO002',
        configData: {
          addit: [
            {
              estado: 'ABIERTO',
              matriz: 'SI',
              direccionCompleta: 'Test Address',
              tipoEstablecimiento: 'MAT',
              numeroEstablecimiento: '001',
              nombreFantasiaComercial: 'Test Commercial Name',
            },
          ],
          regimen: 'GENERAL',
          categoria: '',
          numeroRuc: '1721529707001',
          razonSocial: 'TEST COMERCIAL',
          agenteRetencion: 'NO',
          tipoContribuyente: 'PERSONA NATURAL',
          contribuyenteEspecial: 'NO',
          contribuyenteFantasma: 'NO',
          representantesLegales: [
            {
              representanteLegal: 'TEST USER',
              identificacionLegal: '1721529707',
            },
          ],
          estadoContribuyenteRuc: 'ACTIVO',
          transaccionesInexistente: 'NO',
          obligadoLlevarContabilidad: 'NO',
          actividadEconomicaPrincipal: 'PRESTACION DE SERVICIOS PROFESIONALES.',
          motivoCancelacionSuspension: '',
          informacionFechasContribuyente: {
            fechaCese: '',
            fechaActualizacion: '',
            fechaInicioActividades: '2022-05-26',
            fechaReinicioActividades: '',
          },
        },
        clientType: 'NATURAL',
        encrypted: false,
      };

      // Mock de la respuesta HTTP
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      httpServiceMock.get.mockReturnValue(of(axiosResponse));

      // Ejecutar el método
      service.getConfigCnbAddress('node-123').subscribe({
        next: (response) => {
          expect(httpServiceMock.get).toHaveBeenCalledWith(
            'http://mock-api/configuration/node-123/search/CO002',
          );
          expect(response).toEqual(mockResponse);
          done();
        },
        error: (error) => {
          done.fail(error);
        },
      });
    });

    it('should throw an error when the HTTP request fails', (done) => {
      // Mock del error HTTP
      const errorMessage = 'Network error';
      httpServiceMock.get.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      // Ejecutar el método
      service.getConfigCnbAddress('node-123').subscribe({
        next: () => {
          done.fail('Expected an error but got a successful response');
        },
        error: (error) => {
          expect(error.message).toContain(
            'Error getting node configuration: Network error',
          );
          done();
        },
      });
    });
  });

  describe('getNodeConfigByCode', () => {
    it('should return config data for a given node id and config code', (done) => {
      const nodeId = 'node-789';
      const configCode = 'TEST001';
      const mockResponse: Partial<GetNodeConfigResponse> = {
        id: 'config-789',
        nodeId: nodeId,
        configName: configCode,
        configData: { key: 'value' },
        clientType: 'COMMERCE' as any,
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      httpServiceMock.get.mockReturnValue(of(axiosResponse));

      service.getNodeConfigByCode(nodeId, configCode).subscribe({
        next: (response) => {
          expect(httpServiceMock.get).toHaveBeenCalledWith(
            `http://mock-api/configuration/${nodeId}/search/${configCode}`,
          );
          expect(response).toEqual(mockResponse);
          done();
        },
        error: (error) => {
          done.fail(error);
        },
      });
    });

    it('should throw an error when the HTTP request fails', (done) => {
      const nodeId = 'node-789';
      const configCode = 'TEST001';
      const errorMessage = 'Network error';
      httpServiceMock.get.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      service.getNodeConfigByCode(nodeId, configCode).subscribe({
        next: () => {
          done.fail('Expected an error but got a successful response');
        },
        error: (error) => {
          expect(error.message).toContain(
            `Error getting node configuration for code ${configCode}: ${errorMessage}`,
          );
          done();
        },
      });
    });
  });
});
