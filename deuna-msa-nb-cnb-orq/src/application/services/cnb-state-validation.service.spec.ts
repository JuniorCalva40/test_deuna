import { CnbStateValidationService } from './cnb-state-validation.service';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbStateValidationDTO } from '../dto/cnb-state-validation-request.dto';
import { CNB_STATE_VALIDATION_STORAGE_PORT } from '../ports/out/storage/cnb-state-validation-storage.port';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('CnbStateValidationService', () => {
  let service: CnbStateValidationService;
  let logger: any;
  let storagePort: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() } as any;
    storagePort = {
      saveCnbStateValidation: jest.fn(),
      getCnbStateValidation: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnbStateValidationService,
        {
          provide: CNB_STATE_VALIDATION_STORAGE_PORT,
          useValue: storagePort,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<CnbStateValidationService>(CnbStateValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveValidation', () => {
    it('should call use case and return response', async () => {
      const id = 'test-id';
      const dto: CnbStateValidationDTO = {
        identification: id,
        cnbState: 'ACTIVE',
        preApprovedState: 'BLOCKED_BLACKLIST',
        merchantName: 'Test Merchant',
        remainingAttemptsOnb: 3,
        address: [],
      } as any;

      storagePort.saveCnbStateValidation.mockResolvedValue(undefined);

      const result = await service.saveValidation(id, dto);

      expect(storagePort.saveCnbStateValidation).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual({ identification: id });
    });
  });

  describe('getValidation', () => {
    it('should return not_found response if nothing is found', async () => {
      const id = 'not-found-id';
      storagePort.getCnbStateValidation.mockResolvedValue(undefined);

      const result = await service.getValidation(id);

      expect(result).toEqual({
        status: 'not_found',
        identification: id,
      });
    });

    it('should return found response if found', async () => {
      const id = 'found-id';
      const dto: CnbStateValidationDTO = {
        identification: id,
        cnbState: 'ACTIVE',
        preApprovedState: 'BLOCKED_BLACKLIST',
        merchantName: 'Test Merchant',
        remainingAttemptsOnb: 3,
        address: [],
      } as any;
      storagePort.getCnbStateValidation.mockResolvedValue(dto);

      const result = await service.getValidation(id);

      expect(result).toEqual({ ...dto, status: 'found' });
    });
  });
});
