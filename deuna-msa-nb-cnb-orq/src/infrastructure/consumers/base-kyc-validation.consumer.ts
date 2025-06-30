import { Logger, OnModuleInit } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { KycValidationService } from '@src/application/services/kyc-validation.service';

export abstract class BaseKycValidationConsumer implements OnModuleInit {
  protected readonly logger: Logger;
  protected readonly topicName: string;

  constructor(
    protected readonly kycValidationService: KycValidationService,
    loggerName: string,
    topicName: string,
  ) {
    this.logger = new Logger(loggerName);
    this.topicName = topicName;
  }

  onModuleInit() {
    this.logger.log(
      `${this.constructor.name} initialized. Listening for messages in the ${this.topicName} topic`,
    );
  }

  protected async handleMessage(
    message: any,
    context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    try {
      this.logger.debug('Mensaje recibido:', message);
      this.logger.log(
        `Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
      );

      // Delegate processing to the service
      await this.kycValidationService.processValidationMessage(message);

      // Confirm successful processing
      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);

      this.logger.log(
        `Mensaje procesado exitosamente. Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
      );
    } catch (error) {
      this.logger.error('Error processing KYC validation message:', error);

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
