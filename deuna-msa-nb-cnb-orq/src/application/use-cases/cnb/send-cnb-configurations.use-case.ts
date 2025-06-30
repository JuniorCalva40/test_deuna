import { Logger } from '@deuna/tl-logger-nd';
import { CnbConfigSenderPort } from '../../ports/out/clients/cnb-config-sender.port';
import { CnbConfigurationsRequestDto } from '../../dto/cnb-configurations-request.dto';
import { CnbConfigurationsResponseDto } from '../../dto/cnb-configurations-response.dto';

export class SendCnbConfigurationsUseCase {
  constructor(
    private readonly cnbConfigSenderPort: CnbConfigSenderPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    configRequest: CnbConfigurationsRequestDto,
  ): Promise<CnbConfigurationsResponseDto> {
    try {
      this.logger.log(
        `init | SendCnbConfigurationsUseCase | execute | request: ${JSON.stringify(
          configRequest,
        )}`,
      );

      const response = await this.cnbConfigSenderPort.sendConfigurations(configRequest);

      this.logger.log(
        `finish | SendCnbConfigurationsUseCase | execute | response: ${JSON.stringify(
          response,
        )}`,
      );

      return response;
    } catch (error) {
      this.logger.error('error | SendCnbConfigurationsUseCase | execute', error);
      throw error;
    }
  }
} 