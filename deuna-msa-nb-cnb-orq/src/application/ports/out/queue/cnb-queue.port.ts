import { CnbStatusRequestDto } from '@src/application/dto/cnb-status-request.dto';

export const CNB_QUEUE_PORT = 'CNB_QUEUE_PORT' as const;

export interface CnbQueuePort {
  publishConfigCnb(config: CnbStatusRequestDto): Promise<void>;
}
