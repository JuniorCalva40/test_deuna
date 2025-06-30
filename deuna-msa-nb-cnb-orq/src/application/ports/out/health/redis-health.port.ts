export const REDIS_HEALTH_PORT = 'REDIS_HEALTH_PORT' as const;

export interface RedisHealthPort {
  validateConnection(): Promise<boolean>;
  getConnectionStatus(): Promise<{
    isConnected: boolean;
    lastChecked: string;
    latency: number;
    port: number;
  }>;
}
