import { Controller, Inject, Post, Body } from '@nestjs/common';
import { KycResponseDto } from '../../../application/dto/kyc-response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbStatusRequestDto } from '../../../application/dto/cnb-status-request.dto';
import { ConfigurationNb005Dto } from '../../../application/dto/configuration/configuration-nb005.dto';
import { CnbServicePort } from '../../../application/ports/in/services/cnb.service.port';
import { CNB_PORT } from '../../../application/services/cnb.service';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

@Controller('v1/cnb')
export class CnbController {
  constructor(
    @Inject(CNB_PORT)
    private readonly cnbService: CnbServicePort,
    private readonly logger: Logger,
  ) { }

  @Post('complete')
  @ApiOperation({ summary: 'Inicia el completado de Onboarding de CNB' })
  @ApiResponse({ type: KycResponseDto })
  async completeStatus(@Body() request: CnbStatusRequestDto): Promise<any> {
    return await this.cnbService.completeOnboadingCnb(request);
  }

  @MessagePattern('cnb.cnb.complete')
  async handleCompleteOnboardingRequest(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const partition = context.getPartition();
    const topic = context.getTopic();
    const offset = context.getMessage().offset;

    try {
      this.logger.log(
        `init | handleCompleteOnboardingRequest | CnbController | Message processed successfully. Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
      );
      await this.cnbService.sendConfigData(message);

      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);
    } catch (error) {
      this.logger.error(
        'error | handleCompleteOnboardingRequest | CnbController',
        error,
      );
      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);
      throw error;
    }
  }

  @MessagePattern('cnb.digital-signature.response')
  async handleConfigurationNB005Message(
    @Payload() message: ConfigurationNb005Dto,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `init | handleConfigurationNB005Message | CnbController | Message processed successfully. Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
    );

    try {
      await this.cnbService.updateConfigNb005(
        message,
      );

      this.logger.log(
        `finish | handleConfigurationNB005Message | CnbController | Message processed successfully. Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
      );

      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);

    } catch (error) {
      this.logger.error(
        `error | handleConfigurationNB005Message | CnbController | Error processing message. Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
        error,
      );

      await context
        .getConsumer()
        .commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);
    }
  }
}
