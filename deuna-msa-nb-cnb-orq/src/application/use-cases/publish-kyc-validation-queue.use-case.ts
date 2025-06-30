import { Injectable, Inject } from '@nestjs/common';
import {
  KycQueuePort,
  KYC_QUEUE_PORT,
} from '../ports/out/queue/kyc-queue.port';
import { TrackingInfoDto } from '@src/infrastructure/constants/common';
import { validateTrackingHeadersApi } from '@src/domain/utils/validator-tracking-headers-api';
import { Logger } from '@deuna/tl-logger-nd';
/**
 * Use case to publish KYC validation requests in the Kafka queue
 */
@Injectable()
export class PublishKycValidationQueueUseCase {
  constructor(
    @Inject(KYC_QUEUE_PORT)
    private readonly kycQueuePort: KycQueuePort,
    private readonly logger: Logger,
  ) {}

  /**
   * Publish validation messages in the Kafka queue for Liveness and Facial
   * @param scanId Unique identifier of the scan
   * @returns Promise<void>
   */
  async execute(scanId: string, trackingInfo: TrackingInfoDto): Promise<void> {
    const { sessionId, trackingId, requestId } = trackingInfo;
    validateTrackingHeadersApi(
      this.logger,
      'Starting KYC Orchestrator Request -',
      sessionId,
      trackingId,
      requestId,
    );
    try {
      // Publicar eventos para procesamiento asíncrono
      await Promise.all([
        this.kycQueuePort.publishValidationRequest(scanId, 'liveness'),
        this.kycQueuePort.publishValidationRequest(scanId, 'facial'),
      ]);
    } catch (error) {
      throw new Error(`Error publishing validation requests: ${error.message}`);
    }
  }
}
