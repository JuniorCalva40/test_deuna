import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { KycValidationService } from '../../../application/services/kyc-validation.service';

/**
 * Controller that listens for Kafka messages for KYC validation
 * Delegates processing to the KycValidationService
 */
@Controller()
export class KycQueueValidationController implements OnModuleInit {
  private readonly logger = new Logger(KycQueueValidationController.name);

  constructor(private readonly kycValidationService: KycValidationService) {}

  onModuleInit() {
    this.logger.log(
      'KycQueueValidationController initialized. Waiting for messages in the cnb.kyc.queue topic...',
    );
  }

  /**
   * Kafka message handler for KYC validation
   * Delegates processing to the service
   */
  @MessagePattern('cnb.kyc.queue')
  async handleValidationRequest(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    try {
      this.logger.debug('Mensaje recibido de Kafka:', message);
      this.logger.log(
        `Topic: ${context.getTopic()}, Partition: ${context.getPartition()}, Offset: ${context.getMessage().offset}`,
      );

      // Delegate processing to the service
      await this.kycValidationService.processValidationMessage(message);

      // Confirm successful message processing
      const partition = context.getPartition();
      const topic = context.getTopic();
      const offset = context.getMessage().offset;

      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);

      this.logger.log(
        `Mensaje procesado exitosamente. Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
      );
    } catch (error) {
      // Log the error but still confirm to Kafka to avoid infinite retries
      this.logger.error('Error processing KYC validation message:', error);

      // Get Kafka context information
      const topic = context.getTopic();
      const partition = context.getPartition();
      const offset = context.getMessage().offset;

      // Confirm the offset to avoid the message getting stuck
      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);

      // Re-throw the error so it can be handled at higher levels if necessary
      throw error;
    }
  }
}
