import { ConfigService } from '@nestjs/config';
import { RedisModuleOptions } from '@deuna/tl-cache-nd';

export const getCacheConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  host: configService.get<string>('REDIS_HOST', 'localhost'),
  port: configService.get<string>('REDIS_PORT', '6379'),
  ...(configService.get<string>('REDIS_TLS_ENABLED') === 'true'
    ? {
        password: configService.get<string>('REDIS_AUTH'),
        tls: true,
        servername: configService.get<string>('REDIS_HOST'),
      }
    : {}),
});

export const CACHE_TTL_SECONDS = (configService: ConfigService): number =>
  configService.get<number>('CACHE_TTL_SECONDS', 3600);
