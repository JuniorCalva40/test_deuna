export const HEALTH_SERVICE_PORT = 'HEALTH_SERVICE_PORT' as const;

export interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
  version: string;
  dependencies: {
    redis: {
      status: string;
      latency: number;
      lastChecked: string;
      port: number;
    };
  };
}

export interface HealthServicePort {
  checkHealth(): Promise<HealthStatus>;
}
