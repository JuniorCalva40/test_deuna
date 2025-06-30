import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KycQueuePort } from '@src/application/ports/out/queue/kyc-queue.port';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaKycQueueAdapter implements KycQueuePort {
  private readonly logger = new Logger(KafkaKycQueueAdapter.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishValidationRequest(
    scanId: string,
    type: 'liveness' | 'facial',
  ): Promise<void> {
    const message = {
      scanId,
      type,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Attempting to publish message to cnb.kyc.queue: ${JSON.stringify(message)}`,
    );

    try {
      await firstValueFrom(this.kafkaClient.emit('cnb.kyc.queue', message));
      this.logger.log(
        `Message published successfully to cnb.kyc.queue for scanId: ${scanId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error publishing message to cnb.kyc.queue: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
