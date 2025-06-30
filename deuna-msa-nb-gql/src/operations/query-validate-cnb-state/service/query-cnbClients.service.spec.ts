import { Test, TestingModule } from '@nestjs/testing';
import { CnbClientsService } from './query-cnbClients.service';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { MSA_MC_BO_HIERARCHY_SERVICE } from '../../../external-services/msa-mc-bo-hierarchy/providers/msa-mc-bo-hierarchy.provider';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider';
import { of, throwError } from 'rxjs';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ValidateCnbStateInput } from '../dto/validate-cnb-state.input.dto';
import { EstablishmentValidateCnbOutputDto } from '../../../utils/establishment.dto';
import { CnbState, PreApprovedState } from '../../../common/constants/common';
import { MSA_TL_BP_DATA_PROVIDER_SERVICE } from '../../../external-services/msa-tl-bp-data-provider/providers/msa-tl-bp-data-provider';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';

// Mock the ErrorHandler to capture specific error codes
jest.mock('../../../utils/error-handler.util', () => ({
  ErrorHandler: {
    handleError: jest.fn((message, code, origin) => {
      if (!origin) {
        throw new Error(`[${code}] Error: ${message}`);
      }
      return {
        error: true,
        errorCode: code,
        errorMessage: message,
        origin,
      };
    }),
  },
}));

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  })),
}));

describe('CnbClientsService', () => {
  let service: CnbClientsService;
  let clientServiceNbMock: any;
  let clientServiceMcMock: any;
  let hierarchyServiceMock: any;
  let configurationServiceMock: any;
  let loggerSpy: any;
  let dataProviderServiceMock: any;
  let orqServiceMock: any;

  const mockValidateInput: ValidateCnbStateInput = {
    identification: '1234567890',
    comercialName: 'Test Merchant',
    status: 'ACTIVE',
    sessionId: 'test-session',
    trackingId: 'test-tracking',
    requestId: 'test-request',
    fullName: 'Test User',
  };

  const noBlackListResult = {
    result: [
      {
        blackListType: 'PROV,PLAPP',
        isUserOnBlackList: false,
      },
    ],
  };

  const blackListResult = {
    result: [
      {
        blackListType: 'PROV,PLAPP',
        isUserOnBlackList: true,
        error: 'message-error',
      },
    ],
  };
  beforeEach(async () => {
    // Reset the mocks before each test
    jest.clearAllMocks();

    clientServiceNbMock = {
      getClientByIdentification: jest.fn(),
      updateClientStatus: jest.fn(),
    };

    clientServiceMcMock = {
      getClientData: jest.fn(),
    };

    hierarchyServiceMock = {
      getHierarchyNodes: jest.fn(),
    };

    configurationServiceMock = {
      getConfigCnbState: jest.fn(),
      getConfigCnbAddress: jest.fn(),
    };

    dataProviderServiceMock = {
      validateBlacklist: jest.fn(),
    };
    orqServiceMock = {
      getCnbState: jest.fn().mockReturnValue(of({ found: false })),
      saveCnbState: jest.fn().mockReturnValue(of(undefined)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnbClientsService,
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: clientServiceNbMock,
        },
        {
          provide: MSA_MC_BO_CLIENT_SERVICE,
          useValue: clientServiceMcMock,
        },
        {
          provide: MSA_MC_BO_HIERARCHY_SERVICE,
          useValue: hierarchyServiceMock,
        },
        {
          provide: MSA_MC_BO_CONFIGURATION_SERVICE,
          useValue: configurationServiceMock,
        },
        {
          provide: MSA_TL_BP_DATA_PROVIDER_SERVICE,
          useValue: dataProviderServiceMock,
        },
        {
          provide: MSA_NB_CNB_ORQ_SERVICE,
          useValue: orqServiceMock,
        },
      ],
    }).compile();

    service = module.get<CnbClientsService>(CnbClientsService);
    loggerSpy = jest.spyOn((service as any).logger, 'error');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCnbState', () => {
    it('should validate client state successfully when client is not approved', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'PENDING', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );
      orqServiceMock.getCnbState.mockReturnValue(
        of({ found: false, isBlacklisted: false }),
      );

      const result = await service.validateCnbState(mockValidateInput);

      expect(result).toEqual({
        status: 'SUCCESS',
        cnbState: 'INACTIVE',
        preApprovedState: 'PENDING',
        merchantName: 'Test Merchant',
        remainingAttemptsOnb: 0,
        address: [
          {
            fullAddress: 'Test Address 123',
            numberEstablishment: '12345',
            state: 'ABIERTO',
            headquarters: 'test',
            establishmentType: 'ONLINE',
            commercialName: 'Test Commercial Name',
          } as EstablishmentValidateCnbOutputDto,
        ],
      });
    });

    it('should set cnbState to null if configData.status is initially falsy', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'PENDING', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: null } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );

      const result = await service.validateCnbState(mockValidateInput);

      expect(result.cnbState).toBeNull();
      expect(result.status).toBe('SUCCESS');
    });

    it('should throw error when identification is missing', async () => {
      const input = { ...mockValidateInput, identification: '' };
      await expect(service.validateCnbState(input)).rejects.toThrow(
        `[${ErrorCodes.CNB_CLIENT_NOT_FOUND}] Error: Identification is required`,
      );
    });

    it('should handle error when cnb client service fails', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        '[NB_ERR_805] Error: Error fetching cnb-client data',
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should handle error when MC client service fails', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        '[NB_ERR_805] Error: Error fetching client data',
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should handle error when hierarchy service fails', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        '[NB_ERR_805] Error: Error fetching nodes',
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should handle error when config service fails', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        '[NB_ERR_805] Error: Error fetching config client state',
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should throw error when CNB client is not found', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(of(null));
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[${ErrorCodes.CNB_CLIENT_NOT_FOUND}] Error: Cnb-client not found`,
      );
    });

    it('should throw error when CNB client status is missing', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(of({}));
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[${ErrorCodes.CNB_INVALID_STATUS}] Error: Invalid cnb-client status, the status is missing`,
      );
    });

    it('should throw error when MC client is not found', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE' }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of(null));
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[${ErrorCodes.CNB_CLIENT_NOT_FOUND}] Error: Client not found`,
      );
    });

    it('should throw error when MC client ID is missing', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE' }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({}));
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[${ErrorCodes.CNB_INVALID_STATUS}] Error: Invalid client id, the id is missing`,
      );
    });

    it('should handle error when config address service fails', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[${ErrorCodes.CNB_CONFIG_ADDRESS_ERROR}] Error: Error fetching config client address`,
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should throw error when CNB address is missing', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({ configData: { addit: null } }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );

      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[${ErrorCodes.CNB_CLIENT_INVALID_ADDRESS}] Error: Invalid cnb address, the address is missing`,
      );
    });

    it('should throw an error if hierarchy nodes are not found', async () => {
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'PENDING', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(of({ items: [] }));
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );

      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        `[NB_ERR_805] Error: Service - operation validate-cnb-state: TypeError: Cannot read properties of undefined (reading 'id')`,
      );
    });
  });

  // New describe block for validateClientCnbBlockedTmpStatus
  describe('validateClientCnbBlockedTmpStatus', () => {
    let cnbClientServiceNbUpdateSpy: jest.SpyInstance;

    beforeEach(() => {
      // Spy on updateClientStatus directly on the mock object
      cnbClientServiceNbUpdateSpy = jest.spyOn(
        clientServiceNbMock,
        'updateClientStatus',
      );
    });

    afterEach(() => {
      jest.restoreAllMocks(); // Restore all mocks, including spies
    });

    it('should throw CLIENT_BLOCKED_TMP_OTP error if client is BLOCKED_TMP and block has not expired', async () => {
      const fiveMinutesAgo = new Date(
        Date.now() - 5 * 60 * 1000, // Blocked 5 minutes ago
      ).toISOString();

      const mockCnbClient = {
        id: 'cnb-123',
        status: PreApprovedState.BLOCKED_TMP,
        blockedTmpAt: fiveMinutesAgo,
        remainingAttemptsOnb: 0,
      };

      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of(mockCnbClient),
      );
      // Mock other service calls for the main flow up to the point of failure
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: 'mc-123' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: 'hierarchy-123' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'ACTIVE' } }),
      ); // CNB state is active
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({ configData: { addit: [] } }),
      );

      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        new RegExp(
          `${ErrorCodes.CLIENT_BLOCKED_TMP_OTP}.*Client is temporarily blocked by the OTP`,
        ),
      );
    });

    it('should call updateClientStatus if client is BLOCKED_TMP and block HAS expired', async () => {
      const fifteenMinutesAgo = new Date(
        Date.now() - 15 * 60 * 1000,
      ).toISOString(); // Block expired (10 min threshold)
      const mockCnbClient = {
        id: 'client-123',
        status: PreApprovedState.BLOCKED_TMP,
        blockedTmpAt: fifteenMinutesAgo,
        identification: '1234567890',
        remainingAttemptsOnb: 0,
      };

      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of(mockCnbClient),
      );
      cnbClientServiceNbUpdateSpy.mockReturnValue(of({ success: true })); // Mock successful status update

      // Mock other service calls for the main flow
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: 'mc-123' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: 'node-1' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'ACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address',
                matriz: 'SI',
                nombreFantasiaComercial: 'Test Name',
                numeroEstablecimiento: '001',
                tipoEstablecimiento: 'MATRIZ',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );

      const result = await service.validateCnbState(mockValidateInput);

      expect(cnbClientServiceNbUpdateSpy).toHaveBeenCalledWith({
        clientId: mockCnbClient.id,
        status: PreApprovedState.APPROVED,
      });
      // Expect a successful overall response, as the client should now be unblocked and flow continues
      expect(result.status).toBe('SUCCESS');
      expect(result.preApprovedState).toBe(PreApprovedState.BLOCKED_TMP); // Original state before update for this call
      expect(result.cnbState).toBe('ACTIVE');
    });

    it('should throw CLIENT_BLOCKED_TMP_OTP error if client is BLOCKED_TMP and block has expired and updateClientStatus succeeds', async () => {
      const fifteenMinutesAgo = new Date(
        Date.now() - 15 * 60 * 1000, // Blocked 15 minutes ago, should have expired (10 min block)
      ).toISOString();

      const mockCnbClient = {
        id: 'cnb-123',
        status: PreApprovedState.BLOCKED_TMP,
        blockedTmpAt: fifteenMinutesAgo,
        remainingAttemptsOnb: 0,
      };

      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of(mockCnbClient),
      );
      // Mock a successful updateClientStatus
      cnbClientServiceNbUpdateSpy.mockReturnValue(of({ success: true }));

      // Mock other service calls
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: 'mc-123' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: 'hierarchy-123' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'ACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address',
                matriz: 'SI',
                nombreFantasiaComercial: 'Test Name',
                numeroEstablecimiento: '001',
                tipoEstablecimiento: 'MATRIZ',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );

      const result = await service.validateCnbState(mockValidateInput);

      expect(cnbClientServiceNbUpdateSpy).toHaveBeenCalledWith({
        clientId: mockCnbClient.id,
        status: PreApprovedState.APPROVED,
      });
      expect(result.status).toBe('SUCCESS');
      expect(result.preApprovedState).toBe(PreApprovedState.BLOCKED_TMP);
    });

    it('should throw CNB_SERVICE_ERROR if client is BLOCKED_TMP, block expired, but updateClientStatus fails', async () => {
      const fifteenMinutesAgo = new Date(
        Date.now() - 15 * 60 * 1000, // Blocked 15 minutes ago
      ).toISOString();

      const mockCnbClient = {
        id: 'cnb-123',
        status: PreApprovedState.BLOCKED_TMP,
        blockedTmpAt: fifteenMinutesAgo,
        remainingAttemptsOnb: 0,
      };

      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of(mockCnbClient),
      );
      // Mock a failure in updateClientStatus
      cnbClientServiceNbUpdateSpy.mockReturnValue(
        throwError(() => new Error('Update failed')),
      );

      // Mock other service calls for the main flow up to the point of failure
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: 'mc-123' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: 'hierarchy-123' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'ACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({ configData: { addit: [{ estado: 'ABIERTO' }] } }),
      );

      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        new RegExp(
          `${ErrorCodes.CNB_SERVICE_ERROR}.*Error updating client status to ${PreApprovedState.APPROVED}`,
        ),
      );
      expect(cnbClientServiceNbUpdateSpy).toHaveBeenCalledWith({
        clientId: mockCnbClient.id,
        status: PreApprovedState.APPROVED,
      });
    });
  });
  describe('validateBlacklist', () => {
    it('should handle error when validateBlacklist service fails', async () => {
      orqServiceMock.getCnbState.mockReturnValue(
        of({ identification: '1234567890', status: 'not_found' }),
      );
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'ACTIVE', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'APPROVED', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        new RegExp(
          `Service - operation validate-cnb-state: Error:.*${ErrorCodes.TL_BP_DATA_PROVIDER_ERROR}`,
        ),
      );
    });

    it('should validate client state successfully when cnb is NOT in blacklist', async () => {
      orqServiceMock.getCnbState.mockReturnValue(
        of({ identification: '1234567890', status: 'not_found' }),
      );
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'APPROVED', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(noBlackListResult),
      );
      orqServiceMock.saveCnbState.mockReturnValue(
        of({ identification: '1234567890' }),
      );

      const result = await service.validateCnbState(mockValidateInput);
      const expectedResult = {
        status: 'SUCCESS',
        cnbState: 'INACTIVE',
        preApprovedState: 'APPROVED',
        merchantName: 'Test Merchant',
        remainingAttemptsOnb: 0,
        address: [
          {
            fullAddress: 'Test Address 123',
            numberEstablishment: '12345',
            state: 'ABIERTO',
            headquarters: 'test',
            establishmentType: 'ONLINE',
            commercialName: 'Test Commercial Name',
          } as EstablishmentValidateCnbOutputDto,
        ],
      };

      expect(result).toEqual(expectedResult);
    });

    it('should validate client state successfully when cnb is in blacklist', async () => {
      orqServiceMock.getCnbState.mockReturnValue(
        of({ identification: '1234567890', status: 'not_found' }),
      );
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'APPROVED', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(blackListResult),
      );
      orqServiceMock.saveCnbState.mockReturnValue(
        of({ identification: '1234567890' }),
      );

      const result = await service.validateCnbState(mockValidateInput);
      const expectedResult = {
        status: 'SUCCESS',
        cnbState: 'INACTIVE',
        preApprovedState: 'INACTIVE',
        merchantName: 'Test Merchant',
        remainingAttemptsOnb: 0,
        address: [
          {
            fullAddress: 'Test Address 123',
            numberEstablishment: '12345',
            state: 'ABIERTO',
            headquarters: 'test',
            establishmentType: 'ONLINE',
            commercialName: 'Test Commercial Name',
          } as EstablishmentValidateCnbOutputDto,
        ],
      };

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when saveCnbState service fails', async () => {
      orqServiceMock.getCnbState.mockReturnValue(
        of({ identification: '1234567890', status: 'not_found' }),
      );
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'APPROVED', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      dataProviderServiceMock.validateBlacklist.mockReturnValue(
        of(blackListResult),
      );
      orqServiceMock.saveCnbState.mockReturnValue(
        throwError(() => new Error('Service error')),
      );

      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        new RegExp(
          `Service - operation validate-cnb-state: Error:.*${ErrorCodes.REDIS_SAVE_ERROR}`,
        ),
      );
    });

    it('should validate client state successfully when cnb state validation is on redis', async () => {
      orqServiceMock.getCnbState.mockReturnValue(
        of({
          identification: '1234567890',
          status: 'found',
          isBlacklisted: true,
        }),
      );
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'APPROVED', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );

      const result = await service.validateCnbState(mockValidateInput);
      const expectedResult = {
        cnbState: CnbState.INACTIVE,
        preApprovedState: PreApprovedState.INACTIVE,
        merchantName: 'Test Merchant',
        remainingAttemptsOnb: 0,
        address: [
          {
            fullAddress: 'Test Address 123',
            numberEstablishment: '12345',
            state: 'ABIERTO',
            headquarters: 'test',
            establishmentType: 'ONLINE',
            commercialName: 'Test Commercial Name',
          } as EstablishmentValidateCnbOutputDto,
        ],
        status: 'SUCCESS',
      };

      expect(result).toEqual(expectedResult);
    });
    it('should handle error when getCnbState service fails', async () => {
      orqServiceMock.getCnbState.mockReturnValue(
        throwError(() => new Error('Service error')),
      );
      clientServiceNbMock.getClientByIdentification.mockReturnValue(
        of({ status: 'APPROVED', remainingAttemptsOnb: 0 }),
      );
      clientServiceMcMock.getClientData.mockReturnValue(of({ id: '12345' }));
      hierarchyServiceMock.getHierarchyNodes.mockReturnValue(
        of({ items: [{ id: '54321' }] }),
      );
      configurationServiceMock.getConfigCnbState.mockReturnValue(
        of({ configData: { status: 'INACTIVE' } }),
      );
      configurationServiceMock.getConfigCnbAddress.mockReturnValue(
        of({
          configData: {
            addit: [
              {
                direccionCompleta: 'Test Address 123',
                matriz: 'test',
                nombreFantasiaComercial: 'Test Commercial Name',
                numeroEstablecimiento: '12345',
                tipoEstablecimiento: 'ONLINE',
                estado: 'ABIERTO',
              },
            ],
          },
        }),
      );
      await expect(service.validateCnbState(mockValidateInput)).rejects.toThrow(
        new RegExp(
          `Service - operation validate-cnb-state: Error:.*${ErrorCodes.REDIS_GET_ERROR}`,
        ),
      );
    });
  });
});
