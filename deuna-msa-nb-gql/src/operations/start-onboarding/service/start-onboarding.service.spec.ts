import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { StartOnboardingService } from './start-onboarding.service';
import { ApolloError } from 'apollo-server-express';
import { ClientData } from '../dto/start-onboarding-response.dto';

describe('StartOnboardingService', () => {
  let service: StartOnboardingService;
  let mockMsaCoCommerceService: any;
  let mockMsaNbClientService: any;
  let mockMsaCoOnboardingStatusService: any;
  let mockMsaMcBoConfigurationService: any;
  let mockHierarchyService: any;
  let mockMsaMcBoClientService: any;

  const mockUsername = 'testuser';
  const mockEmail = 'test@test.com';
  const mockSessionId = 'session-123';
  const mockTrackingId = 'tracking-123';
  const mockRequestId = 'request-123';
  const mockMerchantData = {
    id: '123',
    identification: '1234567890',
    businessName: 'Test Business',
    comercialName: 'Test Commercial',
    coordinator: {
      name: 'Test Coordinator',
      identification: '1234567890',
    },
  };
  const mockClient = { id: 'client-123' };

  const baseMockInput = {
    username: mockUsername,
    email: mockEmail,
    sessionId: mockSessionId,
    trackingId: mockTrackingId,
    requestId: mockRequestId,
    identification: 'test-identification',
    id: 'test-id',
    businessName: 'Test Business',
    applicantName: 'Test Name',
    applicantLastName: 'Test LastName',
    phoneNumber: '1234567890',
  };

  beforeEach(async () => {
    mockMsaCoCommerceService = {
      getUserByUsername: jest.fn(),
    };
    mockMsaNbClientService = {
      getClientByIdentification: jest.fn(),
      updateClientData: jest.fn(),
      updateClientStatus: jest.fn(),
    };
    mockMsaCoOnboardingStatusService = {
      initOnboarding: jest.fn(),
      startOnboarding: jest.fn(),
    };
    mockMsaMcBoConfigurationService = {
      getConfigCnbAddress: jest.fn(),
    };
    mockHierarchyService = {
      getHierarchyNodes: jest.fn(),
    };
    mockMsaMcBoClientService = {
      getClientData: jest.fn(),
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
        {
          provide: 'MSA_MC_BO_CONFIGURATION_SERVICE',
          useValue: mockMsaMcBoConfigurationService,
        },
        {
          provide: 'MSA_MC_BO_HIERARCHY_SERVICE',
          useValue: mockHierarchyService,
        },
        {
          provide: 'MSA_MC_BO_CLIENT_SERVICE',
          useValue: mockMsaMcBoClientService,
        },
        {
          provide: 'MSA_NB_CNB_ORQ_SERVICE',
          useValue: {
            createElectronicSign: jest.fn().mockResolvedValue({
              status: 'SUCCESS',
              message: 'Created successfully',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StartOnboardingService>(StartOnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startOnboarding', () => {
    const mockConfigResponse = {
      configData: {
        addit: [
          {
            estado: 'ABIERTO',
            direccionCompleta: 'Test Address 1',
            numeroEstablecimiento: '001',
          },
          {
            estado: 'CERRADO',
            direccionCompleta: 'Test Address 2',
            numeroEstablecimiento: '002',
          },
        ],
        numeroRuc: '123456789',
        razonSocial: 'Test Company',
        estadoContribuyenteRuc: 'ACTIVO',
        actividadEconomicaPrincipal: 'Test Activity',
        tipoContribuyente: 'NATURAL',
        regimen: 'GENERAL',
        categoria: 'A',
        obligadoLlevarContabilidad: 'SI',
        agenteRetencion: 'NO',
        contribuyenteEspecial: 'NO',
        informacionFechasContribuyente: {
          fechaInicioActividades: '2020-01-01',
          fechaCese: '',
          fechaReinicioActividades: '',
          fechaActualizacion: '2020-01-01',
        },
      },
    };

    it('should successfully start onboarding process', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockStartResponse = { status: 'SUCCESS' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        of(mockStartResponse),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockConfigResponse),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );

      const result = await service.startOnboarding(baseMockInput);

      expect(result).toEqual({
        onboardingSessionId: 'session-123',
        establishments: [
          {
            fullAddress: 'Test Address 1',
            numberEstablishment: '001',
          },
        ],
        status: 'SUCCESS',
      });
    });

    it('should throw ApolloError if client is not found', async () => {
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(of({}));

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        'Client not found with the provided identification',
      );
    });

    it('should throw ApolloError if updating client commerce ID fails', async () => {
      const mockClientData = { id: 'client-123' };
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(false));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        throwError(new Error('Failed to update client-cnb data')),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrowError(
        ApolloError,
      );
    });

    it('should throw ApolloError if initializing onboarding process fails', async () => {
      const mockClientData = { id: 'client-123' };
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(of({}));

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrowError(
        ApolloError,
      );
    });

    it('should handle errors when starting onboarding process', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        throwError(new Error('Failed to start onboarding process')),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockConfigResponse),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrowError(
        'Failed to start onboarding process',
      );
    });

    it('should handle errors when fetching client data', async () => {
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        throwError(new Error('Error fetching client data')),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrowError(
        ApolloError,
      );
    });

    it('should handle errors when fetching hierarchy nodes', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        throwError(new Error('Error fetching nodes')),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should handle errors when fetching config client address', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        throwError(new Error('Error fetching config client address')),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrowError(
        ApolloError,
      );
    });

    it('should handle invalid cnb address list', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };
      const mockInvalidConfigResponse = {
        configData: {
          // addit is missing
          numeroRuc: '123456789',
          razonSocial: 'Test Company',
        },
      };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockInvalidConfigResponse),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrowError(
        ApolloError,
      );
    });

    it('should handle error when prepareDataSignElectronic returns null', async () => {
      const mockClientData: ClientData = {
        id: 'client-123',
        identification: '123456789',
      };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };
      const mockConfigResponse = {
        configData: {
          addit: [
            {
              estado: 'ABIERTO',
              direccionCompleta: 'Test Address',
              numeroEstablecimiento: '001',
            },
          ],
          numeroRuc: '123456789',
          razonSocial: 'Test Company',
          estadoContribuyenteRuc: 'ACTIVO',
          actividadEconomicaPrincipal: 'Test Activity',
          tipoContribuyente: 'NATURAL',
          regimen: 'GENERAL',
          categoria: 'A',
          obligadoLlevarContabilidad: 'SI',
          agenteRetencion: 'NO',
          contribuyenteEspecial: 'NO',
          informacionFechasContribuyente: {
            fechaInicioActividades: '2020-01-01',
            fechaCese: '',
            fechaReinicioActividades: '',
            fechaActualizacion: '2020-01-01',
          },
        },
      };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockConfigResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(of({}));

      // Mock  servicio MSA_NB_CNB_ORQ_SERVICE para devolver null
      jest
        .spyOn(service['msaNbCnbOrqService'], 'createElectronicSign')
        .mockResolvedValue(null);

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should handle error when createElectronicSign throws an error', async () => {
      const mockClientData: ClientData = {
        id: 'client-123',
        identification: '123456789',
      };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };
      const mockConfigResponse = {
        configData: {
          addit: [
            {
              estado: 'ABIERTO',
              direccionCompleta: 'Test Address',
              numeroEstablecimiento: '001',
            },
          ],
          numeroRuc: '123456789',
          razonSocial: 'Test Company',
          estadoContribuyenteRuc: 'ACTIVO',
          actividadEconomicaPrincipal: 'Test Activity',
          tipoContribuyente: 'NATURAL',
          regimen: 'GENERAL',
          categoria: 'A',
          obligadoLlevarContabilidad: 'SI',
          agenteRetencion: 'NO',
          contribuyenteEspecial: 'NO',
          informacionFechasContribuyente: {
            fechaInicioActividades: '2020-01-01',
            fechaCese: '',
            fechaReinicioActividades: '',
            fechaActualizacion: '2020-01-01',
          },
        },
      };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({
          id: 'mc-123',
        }),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockConfigResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(of({}));

      service['msaNbCnbOrqService'].createElectronicSign = jest
        .fn()
        .mockRejectedValue(new Error('Signature creation error'));

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should throw an error if startOnboarding fails', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        throwError(() => new Error('Onboarding start failed')),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockConfigResponse),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({ id: 'mc-123' }),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        'Onboarding start failed',
      );
    });

    it('should handle non-Error exceptions', async () => {
      const mockClientData = { id: 'client-123' };
      const mockInitResponse = { sessionId: 'session-123' };
      const mockHierarchyResponse = { items: [{ id: 1 }] };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClientData),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitResponse),
      );
      mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
        of(mockConfigResponse),
      );
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        of(mockHierarchyResponse),
      );
      mockMsaMcBoClientService.getClientData.mockReturnValue(
        of({ id: 'mc-123' }),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        throwError(() => 'A non-error was thrown'),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        'Unexpected error during onboarding process',
      );
    });
  });

  describe('processEstablishments', () => {
    it('should process establishments correctly when ruc data is present', () => {
      const mockAdditData = [
        {
          estado: 'ABIERTO',
          direccionCompleta: 'Dirección 1',
          numeroEstablecimiento: '001',
          matriz: 'SI',
          tipoEstablecimiento: 'MAT',
          nombreFantasiaComercial: 'Test Fantasy Name',
        },
        {
          estado: 'CERRADO',
          direccionCompleta: 'Dirección 2',
          numeroEstablecimiento: '002',
          matriz: 'NO',
          tipoEstablecimiento: 'SUC',
          nombreFantasiaComercial: 'Test Fantasy Name 2',
        },
      ];

      const result = service['processEstablishments'](mockAdditData);

      expect(result).toEqual([
        {
          fullAddress: 'Dirección 1',
          numberEstablishment: '001',
        },
      ]);
    });

    it('should return empty array when ruc data is not present', () => {
      const result = service['processEstablishments']([]);
      expect(result).toEqual([]);
    });
  });

  describe('startOnboarding error handling', () => {
    it('should handle non-Error objects in catch block', async () => {
      const nonErrorObject = {
        someProperty: 'some value',
      };

      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        throwError(nonErrorObject),
      );

      await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
        '[NB_ERR_805] Error: Error fetching client data from msa-nb-cnb-service',
      );
    });

    it('should handle errors when fetching client data', async () => {
      const mockError = new Error('Client fetch error');
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        throwError(mockError),
      );

      const mockInput = { ...baseMockInput };

      await expect(service.startOnboarding(mockInput)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should handle errors when initializing onboarding process', async () => {
      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClient),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        throwError(new Error('Init onboarding error')),
      );

      const mockInput = { ...baseMockInput };

      await expect(service.startOnboarding(mockInput)).rejects.toThrow(
        ApolloError,
      );
    });

    it('should handle errors when starting onboarding process', async () => {
      const mockInitOnboardingResponse = {
        sessionId: 'session-123',
      };

      mockMsaCoCommerceService.getUserByUsername.mockReturnValue(
        of(mockMerchantData),
      );
      mockMsaNbClientService.getClientByIdentification.mockReturnValue(
        of(mockClient),
      );
      mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
      mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
        of(mockInitOnboardingResponse),
      );
      mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(
        throwError(new Error('Start onboarding error')),
      );

      const mockInput = { ...baseMockInput };

      await expect(service.startOnboarding(mockInput)).rejects.toThrow(
        ApolloError,
      );
    });
  });

  it('should handle error when getConfigCnbAddress fails', async () => {
    const mockClientData: ClientData = {
      id: 'client-123',
      identification: '123456789',
    };
    const mockInitResponse = { sessionId: 'session-123' };
    const mockHierarchyResponse = { items: [{ id: 1 }] };

    mockMsaNbClientService.getClientByIdentification.mockReturnValue(
      of(mockClientData),
    );
    mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
    mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
      of(mockInitResponse),
    );
    mockMsaMcBoClientService.getClientData.mockReturnValue(
      of({
        id: 'mc-123',
      }),
    );
    mockHierarchyService.getHierarchyNodes.mockReturnValue(
      of(mockHierarchyResponse),
    );
    mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
      throwError(new Error('Failed to get config')),
    );

    await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
      ApolloError,
    );
  });

  it('should handle error when startOnboarding returns null', async () => {
    const mockClientData: ClientData = {
      id: 'client-123',
      identification: '123456789',
    };
    const mockInitResponse = { sessionId: 'session-123' };
    const mockHierarchyResponse = { items: [{ id: 1 }] };
    const mockConfigResponse = {
      configData: {
        addit: [
          {
            estado: 'ABIERTO',
            direccionCompleta: 'Test Address',
            numeroEstablecimiento: '001',
          },
        ],
        numeroRuc: '123456789',
      },
    };

    mockMsaNbClientService.getClientByIdentification.mockReturnValue(
      of(mockClientData),
    );
    mockMsaNbClientService.updateClientData.mockReturnValue(of(true));
    mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
      of(mockInitResponse),
    );
    mockMsaMcBoClientService.getClientData.mockReturnValue(
      of({
        id: 'mc-123',
      }),
    );
    mockHierarchyService.getHierarchyNodes.mockReturnValue(
      of(mockHierarchyResponse),
    );
    mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
      of(mockConfigResponse),
    );
    mockMsaCoOnboardingStatusService.startOnboarding.mockReturnValue(of(null));

    await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
      ApolloError,
    );
  });

  it('should handle error when updateClientData returns false', async () => {
    const mockClientData: ClientData = {
      id: 'client-123',
      identification: '123456789',
    };
    const mockInitResponse = { sessionId: 'session-123' };
    const mockHierarchyResponse = { items: [{ id: 1 }] };
    const mockConfigResponse = {
      configData: {
        addit: [
          {
            estado: 'ABIERTO',
            direccionCompleta: 'Test Address',
            numeroEstablecimiento: '001',
          },
        ],
        numeroRuc: '123456789',
      },
    };

    mockMsaNbClientService.getClientByIdentification.mockReturnValue(
      of(mockClientData),
    );
    mockMsaNbClientService.updateClientData.mockReturnValue(of(false));
    mockMsaCoOnboardingStatusService.initOnboarding.mockReturnValue(
      of(mockInitResponse),
    );
    mockMsaMcBoClientService.getClientData.mockReturnValue(
      of({
        id: 'mc-123',
      }),
    );
    mockHierarchyService.getHierarchyNodes.mockReturnValue(
      of(mockHierarchyResponse),
    );
    mockMsaMcBoConfigurationService.getConfigCnbAddress.mockReturnValue(
      of(mockConfigResponse),
    );

    await expect(service.startOnboarding(baseMockInput)).rejects.toThrow(
      ApolloError,
    );
  });
});
