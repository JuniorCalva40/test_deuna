import { CnbStatusRequestDto } from '../../../dto/cnb-status-request.dto';
import { CnbStatusResponseDto } from '../../../dto/cnb-status-response';
import { ConfigurationNb005Dto } from '../../../dto/configuration/configuration-nb005.dto';

export interface CnbServicePort {
  completeOnboadingCnb(
    config: CnbStatusRequestDto,
  ): Promise<CnbStatusResponseDto>;
  sendConfigData(config: CnbStatusRequestDto): Promise<void>;
  updateConfigNb005(config: ConfigurationNb005Dto): Promise<void>;
}
