import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import {
  CNB_QUEUE_PORT,
  CnbQueuePort,
} from '../../ports/out/queue/cnb-queue.port';
import { CnbStatusRequestDto } from '../../dto/cnb-status-request.dto';

@Injectable()
export class PublishCnbConfigQueueUseCase {
  constructor(
    @Inject(CNB_QUEUE_PORT)
    private readonly cnbQueuePort: CnbQueuePort,
    private readonly logger: Logger,
  ) {}

  async execute(config: CnbStatusRequestDto): Promise<void> {
    try {
      // Publicar eventos para procesamiento asíncrono
      await Promise.all([this.cnbQueuePort.publishConfigCnb(config)]);
    } catch (error) {
      throw new Error(`Error publishing validation requests: ${error.message}`);
    }
  }
}
