import { Logger } from '@deuna/tl-logger-nd';
import { CnbConfigClientPort } from '../../ports/out/clients/cnb-config-client.port';

export class GetCnbConfigUseCase {
  constructor(
    private readonly cnbConfigClientPort: CnbConfigClientPort,
    private readonly logger: Logger,
  ) {}

  async execute(nodeId: string, configName: string) {
    try {
      const response = await this.cnbConfigClientPort.getCnbConfig(
        nodeId,
        configName,
      );
      return response;
    } catch (error) {
      this.logger.warn(
        `error | execute | GetCnbConfigUseCase para nodeId: ${nodeId}`,
        error,
      );
      return null;
    }
  }
}
