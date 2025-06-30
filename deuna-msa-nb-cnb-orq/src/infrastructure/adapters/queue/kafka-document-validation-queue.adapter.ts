import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { 
  DocumentValidationQueuePort,
  DocumentValidationQueueData
} from '@src/application/ports/out/queue/document-validation-queue.port';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '@src/domain/utils/format-logger';

@Injectable()
export class KafkaDocumentValidationQueueAdapter implements DocumentValidationQueuePort {
  private readonly logger = new Logger({
    context: KafkaDocumentValidationQueueAdapter.name,
  });

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishDocumentValidationRequest(data: DocumentValidationQueueData): Promise<void> {
    formatLogger(
      this.logger,
      'info',
      `Publishing document validation request to Kafka for scanReference: ${data.scanReference}`,
      data.sessionId,
      data.trackingId,
      data.requestId,
    );

    await firstValueFrom(
      this.kafkaClient.emit('cnb.document.validation', {
        ...data,
      }),
    );

    formatLogger(
      this.logger,
      'info',
      `Successfully published document validation request to Kafka for scanReference: ${data.scanReference}`,
      data.sessionId,
      data.trackingId,
      data.requestId,
    );
  }
} 