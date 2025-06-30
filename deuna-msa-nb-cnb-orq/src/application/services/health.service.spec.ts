import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { REDIS_HEALTH_PORT } from '../ports/out/health/redis-health.port';

describe('HealthService', () => {
  let service: HealthService;
  let mockRedisClient: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.npm_package_version = '1.0.0';

    mockRedisClient = {
      getConnectionStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: REDIS_HEALTH_PORT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('checkHealth', () => {
    it('should return healthy status when Redis is connected', async () => {
      mockRedisClient.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        lastChecked: new Date().toISOString(),
        latency: 100,
        port: 6379,
      });

      const result = await service.checkHealth();

      expect(result.status).toBe('OK');
      expect(result.message).toBe('Service is healthy');
      expect(result.dependencies.redis.status).toBe('UP');
    });

    it('should return degraded status when Redis is not connected', async () => {
      mockRedisClient.getConnectionStatus.mockResolvedValue({
        isConnected: false,
        lastChecked: new Date().toISOString(),
        latency: -1,
        port: 6379,
      });

      const result = await service.checkHealth();

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Service degraded');
      expect(result.dependencies.redis.status).toBe('DOWN');
    });

    it('should handle Redis client errors', async () => {
      mockRedisClient.getConnectionStatus.mockRejectedValue(
        new Error('Redis error'),
      );

      const result = await service.checkHealth();

      expect(result).toEqual({
        status: 'ERROR',
        message: 'Service degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dependencies: {
          redis: {
            status: 'DOWN',
            latency: -1,
            lastChecked: new Date().toISOString(),
            port: 6379,
          },
        },
      });
    });

    it('should use default version when npm_package_version is not set', async () => {
      delete process.env.npm_package_version;
      mockRedisClient.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        lastChecked: new Date().toISOString(),
        latency: 100,
        port: 6379,
      });

      const result = await service.checkHealth();

      expect(result.version).toBe('1.0.0');
    });

    it('should use npm_package_version when available', async () => {
      process.env.npm_package_version = '2.0.0';
      mockRedisClient.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        lastChecked: new Date().toISOString(),
        latency: 100,
        port: 6379,
      });

      const result = await service.checkHealth();

      expect(result.version).toBe('2.0.0');
    });

    it('should handle error in checkRedisHealth method', async () => {
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      mockRedisClient.getConnectionStatus.mockRejectedValue(
        new Error('Connection error'),
      );

      const result = await service.checkHealth();

      expect(result).toEqual({
        status: 'ERROR',
        message: 'Service degraded',
        timestamp: mockDate.toISOString(),
        version: '1.0.0',
        dependencies: {
          redis: {
            status: 'DOWN',
            latency: -1,
            lastChecked: mockDate.toISOString(),
            port: 6379,
          },
        },
      });

      jest.useRealTimers();
    });

    it('should handle error in checkRedisHealth method directly', async () => {
      jest
        .spyOn(service as any, 'checkRedisHealth')
        .mockRejectedValue(new Error('Redis error'));

      const result = await service.checkHealth();

      expect(result).toEqual({
        status: 'ERROR',
        message: 'Service degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dependencies: {
          redis: {
            status: 'DOWN',
            latency: -1,
            lastChecked: new Date().toISOString(),
            port: 6379,
          },
        },
      });
    });
  });

  describe('checkRedisHealth', () => {
    it('should handle error in checkRedisHealth method', async () => {
      mockRedisClient.getConnectionStatus.mockRejectedValue(
        new Error('Connection error'),
      );

      const result = await (service as any).checkRedisHealth();

      expect(result).toEqual({
        isConnected: false,
        lastChecked: new Date().toISOString(),
        latency: -1,
        port: 6379,
      });
    });

    it('should return connection status when successful', async () => {
      const mockStatus = {
        isConnected: true,
        lastChecked: new Date().toISOString(),
        latency: 100,
        port: 6379,
      };
      mockRedisClient.getConnectionStatus.mockResolvedValue(mockStatus);

      const result = await (service as any).checkRedisHealth();

      expect(result).toEqual(mockStatus);
    });
  });
});
