export const MERCHANT_HIERARCHY_PORT = 'MERCHANT_HIERARCHY_PORT' as const;

export interface MerchantHierarchyPort {
  getNodeId(clientId: string): Promise<{
    nodeId: string;
  }>;
}
