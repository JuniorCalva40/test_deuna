import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  RedisHealthPort,
  REDIS_HEALTH_PORT,
} from '../ports/out/health/redis-health.port';
import { Inject } from '@nestjs/common';

@Injectable()
export class RedisConnectionValidatorService implements OnModuleInit {
  private readonly logger = new Logger(RedisConnectionValidatorService.name);

  constructor(
    @Inject(REDIS_HEALTH_PORT)
    private readonly redisHealth: RedisHealthPort,
  ) {}

  async onModuleInit() {
    await this.checkRedisConnection();
  }

  private async checkRedisConnection() {
    try {
      const redisStatus = await this.redisHealth.getConnectionStatus();
      if (redisStatus.isConnected) {
        this.logger.log(
          `Redis connection established successfully on port ${redisStatus.port}`,
        );
        this.logger.log(`Redis latency: ${redisStatus.latency}ms`);
      } else {
        this.logger.error(
          `Failed to connect to Redis on port ${redisStatus.port}`,
        );
      }
    } catch (error) {
      this.logger.error('Error checking Redis connection:', error.message);
    }
  }
}
