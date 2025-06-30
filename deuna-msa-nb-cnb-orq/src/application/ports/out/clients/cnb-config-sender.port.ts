import { CnbConfigurationsRequestDto } from '../../../dto/cnb-configurations-request.dto';
import { CnbConfigurationsResponseDto } from '../../../dto/cnb-configurations-response.dto';

export const CNB_CONFIG_SENDER_PORT = 'CNB_CONFIG_SENDER_PORT' as const;

export interface CnbConfigSenderPort {
  sendConfigurations(
    configurations: CnbConfigurationsRequestDto,
  ): Promise<CnbConfigurationsResponseDto>;
} 