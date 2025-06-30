export const DOCUMENT_VALIDATION_QUEUE_PORT =
  'DOCUMENT_VALIDATION_QUEUE_PORT' as const;

export interface DocumentValidationQueueData {
  scanReference: string;
  type: string;
  sessionId: string;
  trackingId: string;
  requestId: string;
  onboardingSessionId: string;
}

export interface DocumentValidationQueuePort {
  publishDocumentValidationRequest(
    data: DocumentValidationQueueData,
  ): Promise<void>;
}
