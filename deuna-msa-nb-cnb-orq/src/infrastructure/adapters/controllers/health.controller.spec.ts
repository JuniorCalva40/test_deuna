import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HEALTH_SERVICE_PORT } from '../../../application/ports/in/services/health.service.port';

describe('HealthController', () => {
  let controller: HealthController;
  let healthServiceMock: any;

  beforeEach(async () => {
    healthServiceMock = {
      checkHealth: jest.fn().mockResolvedValue({
        status: 'OK',
        message: 'Service is healthy',
        timestamp: '2025-02-19T03:19:14.669Z',
        version: '1.0.0',
        dependencies: {
          redis: {
            status: 'UP',
            latency: 4,
            lastChecked: '2025-02-19T03:19:14.669Z',
            port: 6379,
          },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HEALTH_SERVICE_PORT,
          useValue: healthServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('health', () => {
    it('should return health status', async () => {
      const result = await controller.health();

      expect(result).toEqual({
        status: 'OK',
        message: 'Service is healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        dependencies: {
          redis: {
            status: 'UP',
            latency: expect.any(Number),
            lastChecked: expect.any(String),
            port: expect.any(Number),
          },
        },
      });

      expect(healthServiceMock.checkHealth).toHaveBeenCalled();
    });

    it('should handle service degradation', async () => {
      healthServiceMock.checkHealth.mockResolvedValueOnce({
        status: 'ERROR',
        message: 'Service degraded',
        timestamp: '2025-02-19T03:19:14.669Z',
        version: '1.0.0',
        dependencies: {
          redis: {
            status: 'DOWN',
            latency: -1,
            lastChecked: '2025-02-19T03:19:14.669Z',
            port: 6379,
          },
        },
      });

      const result = await controller.health();

      expect(result.status).toBe('ERROR');
      expect(result.dependencies.redis.status).toBe('DOWN');
    });
  });
});
