export const MERCHANT_CLIENT_PORT = 'MERCHANT_CLIENT_PORT' as const;

export interface MerchantClientPort {
  getClientData(identificationNumber: string): Promise<{
    clientId: string;
  }>;
}
