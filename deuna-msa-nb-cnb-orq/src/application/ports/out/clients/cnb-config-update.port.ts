import { CnbConfigurationItem } from '../../../../application/dto/cnb-configurations-request.dto';

export const CNB_CONFIG_UPDATE_PORT = 'CNB_CONFIG_UPDATE_PORT' as const;

export interface CnbConfigUpdatePort {
  updateCnbConfig(
    configId: string,
    configItem: CnbConfigurationItem,
  ): Promise<void>;
}