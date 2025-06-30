import { Logger } from '@deuna/tl-logger-nd';
import { CnbConfigUpdatePort } from '../../ports/out/clients/cnb-config-update.port';
import { CnbConfigurationItem } from '../../dto/cnb-configurations-request.dto';

export class UpdateCnbConfigUseCase {
  constructor(
    private readonly cnbConfigUpdatePort: CnbConfigUpdatePort,
    private readonly logger: Logger,
  ) { }

  async execute(
    configId: string,
    configItem: CnbConfigurationItem,
  ): Promise<void> {
    try {
      await this.cnbConfigUpdatePort.updateCnbConfig(configId, configItem);
    } catch (error) {
      this.logger.warn(
        `error | UpdateCnbConfigUseCase | execute | configId: ${configId}`,
        error,
      );
      throw error;
    }
  }
}