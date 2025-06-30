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
 * Enhanced KYC validation consumer that uses the KycValidationService
 * to centralize the validation logic and processing
 */
@Injectable()
export class EnhancedKycValidationConsumer extends BaseKycValidationConsumer {
  constructor(kycValidationService: KycValidationService) {
    super(
      kycValidationService,
      EnhancedKycValidationConsumer.name,
      'cnb.kyc.enhanced.queue',
    );
  }

  @MessagePattern('cnb.kyc.enhanced.queue')
  async handleEnhancedValidationRequest(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    return this.handleMessage(message, context);
  }
}
