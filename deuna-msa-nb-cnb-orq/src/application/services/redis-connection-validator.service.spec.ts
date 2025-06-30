import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RedisConnectionValidatorService } from './redis-connection-validator.service';
import { REDIS_HEALTH_PORT } from '../ports/out/health/redis-health.port';

describe('RedisConnectionValidatorService', () => {
  let service: RedisConnectionValidatorService;
  let mockRedisHealth: any;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockRedisHealth = {
      getConnectionStatus: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisConnectionValidatorService,
        {
          provide: REDIS_HEALTH_PORT,
          useValue: mockRedisHealth,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<RedisConnectionValidatorService>(
      RedisConnectionValidatorService,
    );
    (service as any).logger = mockLogger;
  });

  describe('onModuleInit', () => {
    it('should log success when Redis is connected', async () => {
      const mockStatus = {
        isConnected: true,
        port: 6379,
        latency: 100,
      };

      mockRedisHealth.getConnectionStatus.mockResolvedValue(mockStatus);

      await service.onModuleInit();

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Redis connection established successfully on port 6379',
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Redis latency: 100ms');
    });

    it('should log error when Redis is not connected', async () => {
      const mockStatus = {
        isConnected: false,
        port: 6379,
        latency: -1,
      };

      mockRedisHealth.getConnectionStatus.mockResolvedValue(mockStatus);

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to Redis on port 6379',
      );
    });

    it('should handle connection check error', async () => {
      const error = new Error('Connection failed');
      mockRedisHealth.getConnectionStatus.mockRejectedValue(error);

      await service.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking Redis connection:',
        error.message,
      );
    });
  });
});
