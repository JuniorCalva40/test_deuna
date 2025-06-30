import { Injectable, Inject } from '@nestjs/common';
import {
  HealthServicePort,
  HealthStatus,
} from '../ports/in/services/health.service.port';
import {
  RedisHealthPort,
  REDIS_HEALTH_PORT,
} from '../ports/out/health/redis-health.port';

@Injectable()
export class HealthService implements HealthServicePort {
  constructor(
    @Inject(REDIS_HEALTH_PORT)
    private readonly redisClient: RedisHealthPort,
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    try {
      const redisHealth = await this.checkRedisHealth();

      return {
        status: redisHealth.isConnected ? 'OK' : 'ERROR',
        message: redisHealth.isConnected
          ? 'Service is healthy'
          : 'Service degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies: {
          redis: {
            status: redisHealth.isConnected ? 'UP' : 'DOWN',
            latency: redisHealth.latency,
            lastChecked: redisHealth.lastChecked,
            port: redisHealth.port,
          },
        },
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: 'Service degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies: {
          redis: {
            status: 'DOWN',
            latency: -1,
            lastChecked: new Date().toISOString(),
            port: 6379,
          },
        },
      };
    }
  }

  private async checkRedisHealth() {
    try {
      return await this.redisClient.getConnectionStatus();
    } catch (error) {
      return {
        isConnected: false,
        lastChecked: new Date().toISOString(),
        latency: -1,
        port: 6379,
      };
    }
  }
}
