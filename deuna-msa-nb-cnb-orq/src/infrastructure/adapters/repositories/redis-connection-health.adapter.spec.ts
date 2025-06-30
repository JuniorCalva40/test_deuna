import { Test, TestingModule } from '@nestjs/testing';
import { RedisConnectionHealthAdapter } from './redis-connection-health.adapter';
import { RedisService } from '@deuna/tl-cache-nd';

describe('RedisConnectionHealthAdapter', () => {
  let adapter: RedisConnectionHealthAdapter;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    redisService = {
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisConnectionHealthAdapter,
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    adapter = module.get<RedisConnectionHealthAdapter>(
      RedisConnectionHealthAdapter,
    );
  });

  describe('getRedisPort', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return default port when REDIS_PORT is not set', () => {
      delete process.env.REDIS_PORT;
      const port = (adapter as any).getRedisPort();
      expect(port).toBe(6379);
    });

    it('should return default port when REDIS_PORT is empty', () => {
      process.env.REDIS_PORT = '';
      const port = (adapter as any).getRedisPort();
      expect(port).toBe(6379);
    });

    it('should return parsed port when REDIS_PORT is valid', () => {
      process.env.REDIS_PORT = '6380';
      const port = (adapter as any).getRedisPort();
      expect(port).toBe(6380);
    });

    it('should return default port when REDIS_PORT is invalid', () => {
      process.env.REDIS_PORT = 'invalid';
      const port = (adapter as any).getRedisPort();
      expect(port).toBe(6379);
    });
  });

  describe('validateConnection', () => {
    it('should return true when connection is successful', async () => {
      redisService.set.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      const result = await adapter.validateConnection();

      expect(result).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith('health:ping', 'ping');
      expect(redisService.del).toHaveBeenCalledWith('health:ping');
    });

    it('should return false when set operation fails', async () => {
      redisService.set.mockRejectedValue(new Error('Connection failed'));

      const result = await adapter.validateConnection();

      expect(result).toBe(false);
    });

    it('should return false when del operation fails', async () => {
      redisService.set.mockResolvedValue(undefined);
      redisService.del.mockRejectedValue(new Error('Connection failed'));

      const result = await adapter.validateConnection();

      expect(result).toBe(false);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connected status when validation succeeds', async () => {
      redisService.set.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      const result = await adapter.getConnectionStatus();

      expect(result).toEqual({
        isConnected: true,
        lastChecked: expect.any(String),
        latency: expect.any(Number),
        port: expect.any(Number),
      });
    });

    it('should return disconnected status when validation fails', async () => {
      redisService.set.mockRejectedValue(new Error('Connection failed'));

      const result = await adapter.getConnectionStatus();

      expect(result).toEqual({
        isConnected: false,
        lastChecked: expect.any(String),
        latency: expect.any(Number),
        port: expect.any(Number),
      });
    });

    it('should handle errors and return disconnected status', async () => {
      redisService.set.mockRejectedValue(new Error('Unexpected error'));

      const result = await adapter.getConnectionStatus();

      expect(result).toEqual({
        isConnected: false,
        lastChecked: expect.any(String),
        latency: expect.any(Number),
        port: expect.any(Number),
      });
    });
  });
});
