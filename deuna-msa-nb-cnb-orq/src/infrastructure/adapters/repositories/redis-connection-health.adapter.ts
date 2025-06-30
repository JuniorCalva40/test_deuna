import { Injectable } from '@nestjs/common';
import { RedisHealthPort } from '../../../application/ports/out/health/redis-health.port';
import { RedisService } from '@deuna/tl-cache-nd';

@Injectable()
export class RedisConnectionHealthAdapter implements RedisHealthPort {
  constructor(private readonly redisService: RedisService) {}

  private getRedisPort(): number {
    const defaultPort = 6379;
    const portValue = process.env.REDIS_PORT;

    if (!portValue || portValue.trim() === '') {
      return defaultPort;
    }

    const port = parseInt(portValue, 10);
    return isNaN(port) ? defaultPort : port;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const testKey = 'health:ping';
      await this.redisService.set(testKey, 'ping');
      await this.redisService.del(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    lastChecked: string;
    latency: number;
    port: number;
  }> {
    const startTime = Date.now();
    try {
      const isConnected = await this.validateConnection();
      return {
        isConnected,
        lastChecked: new Date().toISOString(),
        latency: Date.now() - startTime,
        port: this.getRedisPort(),
      };
    } catch (error) {
      return {
        isConnected: false,
        lastChecked: new Date().toISOString(),
        latency: 0,
        port: this.getRedisPort(),
      };
    }
  }
}
