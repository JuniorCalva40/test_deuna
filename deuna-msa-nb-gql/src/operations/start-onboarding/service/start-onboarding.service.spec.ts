import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { StartOnboardingService } from './start-onboarding.service';
import { StartOnboardingInput } from '../dto/start-onboarding-input.dto';
import { ApolloError } from 'apollo-server-express';

describe('StartOnboardingService', () => {
  let service: StartOnboardingService;
  let mockMsaCoCommerceService: any;
  let mockMsaNbClientService: any;
  let mockMsaCoOnboardingStatusService: any;

  beforeEach(async () => {
    mockMsaCoCommerceService = {
      getUserByUsername: jest.fn(),
    };
    mockMsaNbClientService = {
      getClientByIdentification: jest.fn(),
      updateClientComerceId: jest.fn(),
    };
    mockMsaCoOnboardingStatusService = {
      initOnboarding: jest.fn(),
      startOnboarding: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartOnboardingService,
        {
          provide: 'MSA_CO_COMMERCE_SERVICE',
          useValue: mockMsaCoCommerceService,
        },
        {
          provide: 'MSA_NB_CLIENT_SERVICE',
          useValue: mockMsaNbClientService,
        },
        {
          provide: 'MSA_CO_ONBOARDING_STATE_SERVICE',
          useValue: mockMsaCoOnboardingStatusService,
        },
      ],
    }).compile();

    service = module.get<StartOnboardingService>(StartOnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startOnboarding', () => {
    const mockEmail = 'test@test.com';
    const mockUsername = 'testuser';

    const mockInput: StartOnboardingInput = {
      username: 'testuser',
    };

    const mockMerchantData = {
      comerceId: 'merchant-123',
      companyName: 'ACCROACHCODE S.A.',
      establishment: [
        { fullAddress: 'Test Address', numberEstablishment: '001' },
      ],
      fullName: 'John Doe',
      identification: '1234567890',
      email: 'test@test.com',
      principalContact: '1234567890',
      ruc: {
        result: {
          addit: [
            {
              estado: 'ABIERTO',
              matriz: 'SI',
              direccionCompleta: 'Test Address',
              tipoEstablecimiento: 'MAT',
              numeroEstablecimiento: '001',
              nombreFantasiaComercial: 'PAGOS & FACTURAS',
            },
            {
              estado: 'CERRADO',
              matriz: 'NO',
              direccionCompleta: 'Test Address',
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
    };

    const mockClientData = {
      id: 'client-123',
      email: 'test@test.com',
    };

    const mockInitOnboardingResponse = {
      sessionId: 'session-123',
    };

    const mockStartOnboardingResponse = {
      // Add relevant mock data here
    };

    it('should successfully start onboarding process', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientComerceId.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitOnboardingResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        of(mockStartOnboardingResponse),
      );

      const result = await service.startOnboarding(mockUsername, mockEmail);

      expect(result).toEqual(
        expect.objectContaining({
          sessionId: mockInitOnboardingResponse.sessionId,
          establishments: mockMerchantData.establishment,
          status: 'SUCCESS',
        }),
      );
    });

    it('should throw ApolloError if merchant data is not found', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(of(null));

      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(ApolloError);
      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(
        '[START-ONBOARDING] Error: Failed to get merchant data by username',
      );
    });

    it('should throw ApolloError if client is not found', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(of({}));

      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(ApolloError);
      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow('[START-ONBOARDING] Error: Client not found');
    });

    it('should throw ApolloError if updating client commerce ID fails', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientComerceId.mockReturnValue(of(null));

      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(ApolloError);
      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(
        '[START-ONBOARDING] Error: Failed to update client comerce id',
      );
    });

    it('should throw ApolloError if initializing onboarding process fails', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientComerceId.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(of({}));

      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(ApolloError);
      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(
        '[START-ONBOARDING] Error: Failed to initialize onboarding process',
      );
    });

    it('should throw ApolloError if starting onboarding process fails', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientComerceId.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitOnboardingResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        of(null),
      );

      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(ApolloError);
      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow(
        '[START-ONBOARDING] Error: Failed to start onboarding process',
      );
    });

    it('should handle and rethrow errors', async () => {
      const testError = new Error('Error no especificado');
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        throwError(testError),
      );

      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow('Error no especificado');
      await expect(
        service.startOnboarding(mockUsername, mockEmail),
      ).rejects.toThrow('Error no especificado');
    });
  });
});
