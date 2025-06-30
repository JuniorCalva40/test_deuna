import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import {
  DOCUMENT_VALIDATION_QUEUE_PORT,
  DocumentValidationQueuePort,
  DocumentValidationQueueData,
} from '../../ports/out/queue/document-validation-queue.port';
import { formatLogger } from '../../../domain/utils/format-logger';

/**
 * Caso de uso para publicar solicitudes de validación de documentos en la cola Kafka
 */
@Injectable()
export class PublishDocumentValidationQueueUseCase {
  constructor(
    @Inject(DOCUMENT_VALIDATION_QUEUE_PORT)
    private readonly documentValidationQueuePort: DocumentValidationQueuePort,
    private readonly logger: Logger,
  ) {}

  /**
   * Publish a document validation request message to the Kafka queue
   * @param queueData Data to send to the queue
   * @returns Promise<void>
   */
  async execute(queueData: DocumentValidationQueueData): Promise<void> {
    try {
      await this.documentValidationQueuePort.publishDocumentValidationRequest(
        queueData,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error publishing document validation request: ${error.message} for onboardingSessionId *${queueData.onboardingSessionId}*`,
        queueData.sessionId,
        queueData.trackingId,
        queueData.requestId,
      );
      throw new Error(
        `Error publishing document validation request: ${error.message} for onboardingSessionId *${queueData.onboardingSessionId}*`,
      );
    }
  }
}
