import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CnbStatusRequestDto } from '@src/application/dto/cnb-status-request.dto';
import { CnbQueuePort } from '@src/application/ports/out/queue/cnb-queue.port';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaCnbQueueAdapter implements CnbQueuePort {
  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishConfigCnb(config: CnbStatusRequestDto): Promise<void> {
    await firstValueFrom(
      this.kafkaClient.emit('cnb.cnb.complete', {
        ...config,
      }),
    );
  }
}
