import { Injectable } from '@nestjs/common';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { KycValidationService } from '@src/application/services/kyc-validation.service';
import { BaseKycValidationConsumer } from './base-kyc-validation.consumer';

/**
 * Original KYC validation consumer using the KycValidationService
 * to centralize the business logic
 */
@Injectable()
export class KycValidationConsumer extends BaseKycValidationConsumer {
  constructor(kycValidationService: KycValidationService) {
    super(kycValidationService, KycValidationConsumer.name, 'cnb.kyc.queue');
  }

  /**
   * Kafka message handler for KYC validation
   */
  @MessagePattern('cnb.kyc.queue')
  async handleValidationRequest(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    return this.handleMessage(message, context);
  }
}
