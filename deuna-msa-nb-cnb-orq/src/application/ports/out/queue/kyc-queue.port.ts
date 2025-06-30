export const KYC_QUEUE_PORT = 'KYC_QUEUE_PORT' as const;

export interface KycQueuePort {
  publishValidationRequest(
    scanId: string,
    type: 'liveness' | 'facial',
  ): Promise<void>;
}
