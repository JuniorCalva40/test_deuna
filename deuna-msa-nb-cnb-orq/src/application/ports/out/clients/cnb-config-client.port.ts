export const CNB_CONFIG_CLIENT_PORT = 'CNB_CONFIG_CLIENT_PORT' as const;

export interface CnbConfigResponse {
  data: any;
}

export interface CnbConfigClientPort {
  getCnbConfig(
    nodeId: string,
    configName: string,
  ): Promise<CnbConfigResponse | null>;
}
