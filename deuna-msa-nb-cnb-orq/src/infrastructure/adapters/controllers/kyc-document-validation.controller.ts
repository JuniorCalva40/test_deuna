import {
  Controller,
  Post,
  Body,
  Headers,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { DocumentValidationStartDto } from '../../../application/dto/document-validation-start.dto';
import { DocumentValidationStartServiceResponse } from '../../../application/dto/document-validation-response.dto';
import { formatLogger } from '../../../domain/utils/format-logger';
import { Logger } from '@deuna/tl-logger-nd';
import { KycDocumentValidationPort } from '../../../application/ports/in/document-validation.port';
import { DOCUMENT_VALIDATION_PORT } from '../../../domain/constants/injection.constants';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Controller('/v1/kyc-document-validation')
export class KycDocumentValidationController implements OnModuleInit {
  private readonly logger = new Logger({
    context: KycDocumentValidationController.name,
  });
  private readonly topicName = 'cnb.document.validation';
  private readonly retryDelayMs: number;
  constructor(
    @Inject(DOCUMENT_VALIDATION_PORT)
    private readonly documentValidationService: KycDocumentValidationPort,
    private readonly configService: ConfigService,
  ) {
    this.retryDelayMs = this.configService.get<number>(
      'RETRY_DELAY_MS_QUEUE_IDENTITY_DOCUMENT_VALIDATION',
    );
    if (!this.retryDelayMs) {
      this.retryDelayMs = 10000;
    }
  }

  /**
   * Method that is executed when the module is initialized
   */
  onModuleInit() {
    this.logger.log(
      `${KycDocumentValidationController.name} initialized. Listening messages in the topic ${this.topicName}`,
    );
  }

  @Post()
  async startValidation(
    @Body() dto: DocumentValidationStartDto,
    @Headers('trackingId') trackingId: string,
    @Headers('sessionId') sessionId: string,
    @Headers('requestId') requestId: string,
  ): Promise<DocumentValidationStartServiceResponse> {
    formatLogger(
      this.logger,
      'info',
      'Controller - Starting document validation',
      sessionId,
      trackingId,
      requestId,
    );

    dto.trackingId = trackingId;
    dto.sessionId = sessionId;
    dto.requestId = requestId;

    return await this.documentValidationService.startValidation(dto);
  }

  /**
   * Kafka message handler for document validation
   */
  @MessagePattern('cnb.document.validation')
  async handleDocumentValidationMessage(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;
    const requestId = message.requestId || uuidv4();
    const sessionId = message.sessionId || 'session-not-provided';
    const trackingId = message.trackingId || 'tracking-not-provided';

    // Get the retry count for logging
    const retryCount = message.retryCount || 0;

    formatLogger(
      this.logger,
      'info',
      `Controller - Received message from topic: ${topic}, Partition: ${partition}, Offset: ${offset}, Retry: ${retryCount}`,
      sessionId,
      trackingId,
      requestId,
    );

    try {
      // Process the message with the service
      const result =
        await this.documentValidationService.processDocumentValidationMessage(
          message,
          { requestId, sessionId, trackingId },
        );

      // Check if we need to retry
      if (result.retry === true) {
        // Generate a new requestId for the retry
        const retryRequestId = uuidv4();
        const nextRetryCount = retryCount + 1;

        formatLogger(
          this.logger,
          'info',
          `Controller - PENDING status detected, scheduling retry #${nextRetryCount} in ${this.retryDelayMs / 1000} seconds`,
          sessionId,
          trackingId,
          retryRequestId,
        );

        // Confirm the current message to avoid processing it twice
        await context
          .getConsumer()
          .commitOffsets([
            { topic, partition, offset: (Number(offset) + 1).toString() },
          ]);

        // Schedule the retry using setTimeout
        setTimeout(async () => {
          try {
            formatLogger(
              this.logger,
              'info',
              `Controller - Executing scheduled retry #${nextRetryCount}`,
              sessionId,
              trackingId,
              retryRequestId,
            );

            // Create a new message for the retry with the updated counter
            const retryMessage = {
              ...message,
              requestId: retryRequestId,
              retryCount: nextRetryCount,
              timestamp: new Date().toISOString(),
            };

            // Execute the same service again
            await this.documentValidationService.processDocumentValidationMessage(
              retryMessage,
              { requestId: retryRequestId, sessionId, trackingId },
            );
          } catch (retryError) {
            formatLogger(
              this.logger,
              'error',
              `Controller - Error in scheduled retry: ${retryError.message}`,
              sessionId,
              trackingId,
              retryRequestId,
            );

            // Even though there is an error, we schedule another retry to ensure continuity
            const errorRetryDelayMs = 30000; // 30 seconds in case of error

            formatLogger(
              this.logger,
              'info',
              `Controller - Scheduling additional retry after error in ${errorRetryDelayMs / 1000} seconds`,
              sessionId,
              trackingId,
              retryRequestId,
            );

            // Recursively schedule another retry after error
            setTimeout(() => {
              // Create a message with the same retryCount since this attempt failed
              const errorRetryMessage = {
                ...message,
                requestId: uuidv4(),
                retryCount: nextRetryCount,
                timestamp: new Date().toISOString(),
              };

              // Try to execute the process again
              this.handleDocumentValidationMessage(errorRetryMessage, context);
            }, errorRetryDelayMs);
          }
        }, this.retryDelayMs);

        return;
      }

      // Confirm successful processing only if we don't need to retry
      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);

      formatLogger(
        this.logger,
        'info',
        `Controller - Message processed successfully with status: ${result.status || 'unknown'}`,
        sessionId,
        trackingId,
        requestId,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Controller - Error al procesar el mensaje: ${error.message}`,
        sessionId,
        trackingId,
        requestId,
      );

      // Even though there is an error, we try again after a time
      const errorRetryDelayMs = 20000; // 20 seconds after the error
      const nextRetryCount = retryCount + 1;
      const errorRetryRequestId = uuidv4();

      formatLogger(
        this.logger,
        'info',
        `Controller - Scheduling retry after error in ${errorRetryDelayMs / 1000} seconds`,
        sessionId,
        trackingId,
        errorRetryRequestId,
      );

      // Confirm the offset to avoid the message getting stuck
      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);

      // Schedule a new attempt after error
      setTimeout(() => {
        // Create a message with the incremented retryCount
        const errorRetryMessage = {
          ...message,
          requestId: errorRetryRequestId,
          retryCount: nextRetryCount,
          timestamp: new Date().toISOString(),
        };

        // Try to execute the process again
        this.handleDocumentValidationMessage(errorRetryMessage, context);
      }, errorRetryDelayMs);
    }
  }
}
