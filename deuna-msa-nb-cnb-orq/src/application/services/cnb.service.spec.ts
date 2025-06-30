import { Test, TestingModule } from '@nestjs/testing';
import { CnbService } from './cnb.service';
import {
  CNB_QUEUE_PORT,
  CnbQueuePort,
} from '../ports/out/queue/cnb-queue.port';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbStatusRequestDto } from '../dto/cnb-status-request.dto';
import { ConfigurationNb005Dto } from '../dto/configuration/configuration-nb005.dto';
import {
  CNB_SECUENCE_PORT,
  CnbSecuencePort,
} from '../ports/out/clients/cnb-secuence.port';
import {
  CNB_CONFIG_CLIENT_PORT,
  CnbConfigClientPort,
} from '../ports/out/clients/cnb-config-client.port';
import { GetCnbConfigUseCase } from '../use-cases/cnb/get-cnb-config.use-case';
import {
  CNB_CONFIG_SENDER_PORT,
  CnbConfigSenderPort,
} from '../ports/out/clients/cnb-config-sender.port';
import {
  MERCHANT_CLIENT_PORT,
  MerchantClientPort,
} from '../ports/out/clients/merchant-client.port';
import {
  MERCHANT_HIERARCHY_PORT,
  MerchantHierarchyPort,
} from '../ports/out/clients/merchant-hierarchy.port';
import {
  CNB_CONFIG_UPDATE_PORT,
  CnbConfigUpdatePort,
} from '../ports/out/clients/cnb-config-update.port';
import { SendCnbConfigurationsUseCase } from '../use-cases/cnb/send-cnb-configurations.use-case';
import { PublishCnbConfigQueueUseCase } from '../use-cases/cnb/public-cnb-config-queue.use-case';
import { GetSecuenceUseCase } from '../use-cases/cnb/get-secuence.use-case';

jest.mock('../use-cases/cnb/get-cnb-config.use-case');
jest.mock('../use-cases/cnb/send-cnb-configurations.use-case');
jest.mock('../use-cases/cnb/public-cnb-config-queue.use-case');
jest.mock('../use-cases/cnb/get-secuence.use-case');

describe('CnbService', () => {
  let service: CnbService;
  let queuePort: jest.Mocked<CnbQueuePort>;
  let cnbSecuence: jest.Mocked<CnbSecuencePort>;
  let cnbConfigClient: jest.Mocked<CnbConfigClientPort>;
  let cnbConfigSender: jest.Mocked<CnbConfigSenderPort>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;
  let getCnbConfigUseCase: jest.Mock;
  let sendCnbConfigurationsUseCase: jest.Mock;
  let publishCnbConfigQueueUseCase: jest.Mock;
  let getSecuenceUseCase: jest.Mock;

  beforeEach(async () => {
    queuePort = {
      publishConfigCnb: jest.fn(),
    } as any;

    cnbSecuence = {
      getSecuence: jest.fn().mockResolvedValue('12345'),
    } as any;

    cnbConfigClient = {
      getCnbConfig: jest.fn(),
    } as any;

    cnbConfigSender = {
      sendConfigurations: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'CONFIG_SERVICE_URL') return 'http://config-service';
        if (key === 'CNB_CAPABILITIES') return 'CAP1,CAP2';
        return null;
      }),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    const merchantClientPort = {
      getClientData: jest.fn(),
    };

    const merchantHierarchyPort = {
      getNodeId: jest.fn(),
    };

    const cnbConfigUpdatePort = {
      updateCnbConfig: jest.fn(),
    };

    // Mock for of use case GetCnbConfigUseCase
    getCnbConfigUseCase = jest.fn();
    (GetCnbConfigUseCase as jest.Mock).mockImplementation(() => ({
      execute: getCnbConfigUseCase,
    }));

    // Mock for of use case SendCnbConfigurationsUseCase
    sendCnbConfigurationsUseCase = jest.fn();
    (SendCnbConfigurationsUseCase as jest.Mock).mockImplementation(() => ({
      execute: sendCnbConfigurationsUseCase,
    }));

    // Mock for of use case PublishCnbConfigQueueUseCase
    publishCnbConfigQueueUseCase = jest.fn();
    (PublishCnbConfigQueueUseCase as jest.Mock).mockImplementation(() => ({
      execute: publishCnbConfigQueueUseCase,
    }));

    // Mock for of use case GetSecuenceUseCase
    getSecuenceUseCase = jest.fn().mockResolvedValue('SEC-12345');
    (GetSecuenceUseCase as jest.Mock).mockImplementation(() => ({
      execute: getSecuenceUseCase,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnbService,
        { provide: CNB_QUEUE_PORT, useValue: queuePort },
        { provide: CNB_SECUENCE_PORT, useValue: cnbSecuence },
        { provide: CNB_CONFIG_CLIENT_PORT, useValue: cnbConfigClient },
        { provide: CNB_CONFIG_SENDER_PORT, useValue: cnbConfigSender },
        { provide: MERCHANT_CLIENT_PORT, useValue: merchantClientPort }, // ✅ agregado
        { provide: MERCHANT_HIERARCHY_PORT, useValue: merchantHierarchyPort }, // ✅ agregado
        { provide: CNB_CONFIG_UPDATE_PORT, useValue: cnbConfigUpdatePort }, // ✅ agregado
        { provide: ConfigService, useValue: configService },
        { provide: Logger, useValue: logger },
      ],
    }).compile();

    service = module.get<CnbService>(CnbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should complete onboarding and return response', async () => {
    const dto: CnbStatusRequestDto = {
      commercialName: 'LABORATORIOS GUTIERREZ',
      establishmentType: 'MAT',
      fullAddress:
        'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
      status: 'ABIERTO',
      establishmentNumber: '001',
      headquarters: true,
      nodeId: 'identifi44343',
      typeClient: 'PERSONA NATURAL',
      latitude: '123',
      longitude: '123',
      referenceTransaction: '123',
    };

    publishCnbConfigQueueUseCase.mockResolvedValue(undefined);

    const result = await service.completeOnboadingCnb(dto);

    expect(publishCnbConfigQueueUseCase).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ nodeId: dto.nodeId });
  });

  it('should send config data when no existing config is found', async () => {
    const dto: CnbStatusRequestDto = {
      commercialName: 'LABORATORIOS GUTIERREZ',
      establishmentType: 'MAT',
      fullAddress:
        'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
      status: 'ABIERTO',
      establishmentNumber: '001',
      headquarters: true,
      nodeId: 'identifi44343',
      typeClient: 'PERSONA NATURAL',
      latitude: '123',
      longitude: '123',
      referenceTransaction: '123',
    };

    // Configure mock to return null indicating that no configuration exists
    getCnbConfigUseCase.mockResolvedValue(null);
    getSecuenceUseCase.mockResolvedValue('SEC-12345');
    sendCnbConfigurationsUseCase.mockResolvedValue({ success: true });

    await service.sendConfigData(dto);

    // Verify that getCnbConfigUseCase.execute was called
    expect(getCnbConfigUseCase).toHaveBeenCalledTimes(2);

    // Verify that getSecuenceUseCase.execute was called
    expect(getSecuenceUseCase).toHaveBeenCalled();

    // Verify that the use case for sending the configuration was called
    expect(sendCnbConfigurationsUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        configurations: expect.arrayContaining([
          expect.objectContaining({ configName: 'NB001' }),
          expect.objectContaining({ configName: 'NB002' }),
        ]),
      }),
    );
  });

  it('should send config data when received as JSON string', async () => {
    const dto: CnbStatusRequestDto = {
      commercialName: 'LABORATORIOS GUTIERREZ',
      establishmentType: 'MAT',
      fullAddress:
        'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
      status: 'ABIERTO',
      establishmentNumber: '001',
      headquarters: true,
      nodeId: 'identifi44343',
      typeClient: 'PERSONA NATURAL',
      latitude: '123',
      longitude: '123',
      referenceTransaction: '123',
    };

    // Configure mock to return null indicating that no configuration exists
    getCnbConfigUseCase.mockResolvedValue(null);
    getSecuenceUseCase.mockResolvedValue('SEC-12345');
    sendCnbConfigurationsUseCase.mockResolvedValue({ success: true });

    await service.sendConfigData(JSON.stringify(dto));

    // Verify that getCnbConfigUseCase.execute was called
    expect(getCnbConfigUseCase).toHaveBeenCalledTimes(2);

    // Verify that getSecuenceUseCase.execute was called
    expect(getSecuenceUseCase).toHaveBeenCalled();

    // Verify that the use case for sending the configuration was called
    expect(sendCnbConfigurationsUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        configurations: expect.arrayContaining([
          expect.objectContaining({ configName: 'NB001' }),
          expect.objectContaining({ configName: 'NB002' }),
        ]),
      }),
    );
  });

  it('should not send config data when existing config is found', async () => {
    const dto: CnbStatusRequestDto = {
      commercialName: 'LABORATORIOS GUTIERREZ',
      establishmentType: 'MAT',
      fullAddress:
        'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
      status: 'ABIERTO',
      establishmentNumber: '001',
      headquarters: true,
      nodeId: 'identifi44343',
      typeClient: 'PERSONA NATURAL',
      latitude: '123',
      longitude: '123',
      referenceTransaction: '123',
    };

    // Configure mock to return existing configuration
    getCnbConfigUseCase.mockResolvedValueOnce({ data: { existing: true } });

    await service.sendConfigData(dto);

    // Verify that the use case for sending the configuration was not called
    expect(sendCnbConfigurationsUseCase).not.toHaveBeenCalled();
    expect(getSecuenceUseCase).not.toHaveBeenCalled();
  });

  it('should return undefined when sendConfigData fails', async () => {
    const dto: CnbStatusRequestDto = {
      commercialName: 'LABORATORIOS GUTIERREZ',
      establishmentType: 'MAT',
      fullAddress:
        'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
      status: 'ABIERTO',
      establishmentNumber: '001',
      headquarters: true,
      nodeId: 'identifi44343',
      typeClient: 'PERSONA NATURAL',
      latitude: '123',
      longitude: '123',
      referenceTransaction: '123',
    };

    getCnbConfigUseCase.mockResolvedValue(null);
    getSecuenceUseCase.mockResolvedValue('SEC-12345');
    sendCnbConfigurationsUseCase.mockImplementation(() => {
      throw new Error('Request failed');
    });

    const result = await service.sendConfigData(dto);
    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'error | sendConfigData | CnbService',
      expect.any(Error),
    );
  });

  describe('CnbService - updateConfigNb005', () => {
    let service: CnbService;
    let mockMerchantClientUseCase: any;
    let mockMerchantHierarchyUseCase: any;
    let mockGetCnbConfigUseCase: any;
    let mockUpdateCnbConfigUseCase: any;
    let logger: Logger;

    beforeEach(() => {
      mockMerchantClientUseCase = { execute: jest.fn() };
      mockMerchantHierarchyUseCase = { execute: jest.fn() };
      mockGetCnbConfigUseCase = { execute: jest.fn() };
      mockUpdateCnbConfigUseCase = { execute: jest.fn() };
      logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() } as any;

      service = new CnbService(
        {} as any, // queuePort
        {} as any, // secuencePort
        {} as any, // configClientPort
        {} as any, // configSenderPort
        {} as any, // merchantClientPort
        {} as any, // merchantHierarchyPort
        {} as any, // configUpdatePort
        {} as any, // configService
        logger,
      );

      // Reemplazar use cases manualmente
      (service as any).merchantClientUseCase = mockMerchantClientUseCase;
      (service as any).merchantHierarchyUseCase = mockMerchantHierarchyUseCase;
      (service as any).getCnbConfigUseCase = mockGetCnbConfigUseCase;
      (service as any).updateCnbConfigUseCase = mockUpdateCnbConfigUseCase;
    });

    it('should update NB005 config successfully', async () => {
      const dto: ConfigurationNb005Dto = {
        identificationNumber: '1234567890',
        issueDate: '2024-01-01',
        expirationDate: '2025-01-01',
        issuer: 'Registro Civil',
        status: 'Active',
        referenceTransaction: 'tx-123',
      };

      mockMerchantClientUseCase.execute.mockResolvedValue('client-id-123');
      mockMerchantHierarchyUseCase.execute.mockResolvedValue('node-id-456');
      mockGetCnbConfigUseCase.execute.mockResolvedValue({
        data: {
          id: 'config-id-789',
          encrypted: false,
          clientType: 'NATURAL',
        },
      });

      await service.updateConfigNb005(dto);

      expect(mockMerchantClientUseCase.execute).toHaveBeenCalledWith(dto.identificationNumber);
      expect(mockMerchantHierarchyUseCase.execute).toHaveBeenCalledWith('client-id-123');
      expect(mockGetCnbConfigUseCase.execute).toHaveBeenCalledWith('node-id-456', 'NB005');
      expect(mockUpdateCnbConfigUseCase.execute).toHaveBeenCalledWith(
        'config-id-789',
        expect.objectContaining({
          nodeId: 'node-id-456',
          configName: 'NB005',
          configData: expect.objectContaining({
            issuer: 'Registro Civil',
            referenceTransaction: 'tx-123',
          }),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('finish | updateConfigNb005'),
      );
    });

    it('should throw if config is not found', async () => {
      mockMerchantClientUseCase.execute.mockResolvedValue('client-id-123');
      mockMerchantHierarchyUseCase.execute.mockResolvedValue('node-id-456');
      mockGetCnbConfigUseCase.execute.mockResolvedValue({ data: null });

      await expect(
        service.updateConfigNb005({
          identificationNumber: '1234567890',
          issueDate: '2024-01-01',
          expirationDate: '2025-01-01',
          issuer: 'RC',
          status: 'Active',
          referenceTransaction: 'tx-1',
        }),
      ).rejects.toThrow('NB005 config not found for nodeId: node-id-456');

      expect(mockUpdateCnbConfigUseCase.execute).not.toHaveBeenCalled();
    });

    it('should catch and log unexpected errors', async () => {
      const error = new Error('Unexpected failure');
      mockMerchantClientUseCase.execute.mockRejectedValue(error);

      await expect(
        service.updateConfigNb005({
          identificationNumber: 'fail-case',
          issueDate: '2024-01-01',
          expirationDate: '2025-01-01',
          issuer: 'X',
          status: 'Inactive',
          referenceTransaction: 'tx-2',
        }),
      ).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('error | updateConfigNb005'),
        error,
      );
    });
  });
});
