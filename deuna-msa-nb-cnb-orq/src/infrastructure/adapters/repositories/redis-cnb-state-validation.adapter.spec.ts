import { RedisService } from '@deuna/tl-cache-nd';
import { RedisCnbStateValidationAdapter } from './redis-cnb-state-validation.adapter';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CnbStateValidationDTO } from '../../../application/dto/cnb-state-validation-request.dto';

const data: CnbStateValidationDTO = {
  identification: '12345',
  isBlacklisted: false,
};

describe('RedisCnbStateValidationAdapter', () => {
  let adapter: RedisCnbStateValidationAdapter;
  let redisServiceMock: jest.Mocked<RedisService>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    redisServiceMock = {
      set: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCnbStateValidationAdapter,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    adapter = module.get<RedisCnbStateValidationAdapter>(
      RedisCnbStateValidationAdapter,
    );
    (adapter as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('saveCnbStateValidation', () => {
    it('should save CnbStateValidationDTO successfully', async () => {
      const id = 'test-id';

      await adapter.saveCnbStateValidation(id, data);

      expect(redisServiceMock.set).toHaveBeenCalledWith(
        `cnb-state-validation:${id}`,
        JSON.stringify(data),
        86400,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving cnb state validation for identification: ${id}`,
      );
    });

    it('should handle errors when saving CnbStateValidationDTO', async () => {
      const id = 'test-id';
      redisServiceMock.set.mockRejectedValue(new Error('Redis error'));

      await expect(adapter.saveCnbStateValidation(id, data)).rejects.toThrow(
        `Error saving cnb state validation: Redis error`,
      );
    });
  });

  describe('getCnbStateValidation', () => {
    it('should retrieve CnbStateValidationDTO successfully', async () => {
      const id = 'test-id';
      redisServiceMock.get.mockResolvedValue(JSON.stringify(data));

      const result = await adapter.getCnbStateValidation(id);

      expect(redisServiceMock.get).toHaveBeenCalledWith(
        `cnb-state-validation:${id}`,
      );
      expect(result).toEqual(data);
    });

    it('should return null if no CnbStateValidationDTO is found', async () => {
      const id = 'test-id';
      redisServiceMock.get.mockResolvedValue(null);

      const result = await adapter.getCnbStateValidation(id);

      expect(redisServiceMock.get).toHaveBeenCalledWith(
        `cnb-state-validation:${id}`,
      );
      expect(result).toBeNull();
    });

    it('should handle errors when retrieving CnbStateValidationDTO', async () => {
      const id = 'test-id';
      redisServiceMock.get.mockRejectedValue(new Error('Redis error'));

      await expect(adapter.getCnbStateValidation(id)).rejects.toThrow(
        new Error('Redis error'),
      );
    });
    it('should handle parsing errors when retrieving CnbStateValidationDTO', async () => {
      const id = 'test-id';
      redisServiceMock.get.mockResolvedValue('invalid json');

      await expect(adapter.getCnbStateValidation(id)).rejects.toThrow(
        `Error parsing cnb state validation data: Unexpected token 'i', \"invalid json\" is not valid JSON`,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
    it('should log a warning if no data is found', async () => {
      const id = 'test-id';
      redisServiceMock.get.mockResolvedValue(null);

      const result = await adapter.getCnbStateValidation(id);

      expect(result).toBeNull();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        `No cnb state validation found for identification: ${id}`,
      );
    });
    it('should validate if is an object or string', async () => {
      const id = 'test-id';
      redisServiceMock.get.mockResolvedValue(data);

      const result = await adapter.getCnbStateValidation(id);

      expect(result).toEqual(data);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Retrieving cnb state validation for identification: ${id}`,
      );
    });
  });
});
