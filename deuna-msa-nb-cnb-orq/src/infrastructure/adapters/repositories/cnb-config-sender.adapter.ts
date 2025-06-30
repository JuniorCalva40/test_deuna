import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CnbConfigSenderPort } from '../../../application/ports/out/clients/cnb-config-sender.port';
import { CnbConfigurationsRequestDto } from '../../../application/dto/cnb-configurations-request.dto';
import { CnbConfigurationsResponseDto } from '../../../application/dto/cnb-configurations-response.dto';
import { Logger } from '@deuna/tl-logger-nd';

@Injectable()
export class CnbConfigSenderAdapter implements CnbConfigSenderPort {
  private readonly configServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {
    this.configServiceUrl =
      this.configService.get<string>('CONFIG_SERVICE_URL');

    if (!this.configServiceUrl) {
      this.logger.error(
        'error | CnbConfigSenderAdapter | constructor',
        'CONFIG_SERVICE_URL is not defined',
      );
      throw new Error('CONFIG_SERVICE_URL is not defined');
    }
  }

  async sendConfigurations(
    configurationsRequest: CnbConfigurationsRequestDto,
  ): Promise<CnbConfigurationsResponseDto> {
    try {
      this.logger.log(
        `init | CnbConfigSenderAdapter | sendConfigurations | request: ${JSON.stringify(
          configurationsRequest,
        )}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configServiceUrl}/configuration/all`,
          configurationsRequest,
        ),
      );

      this.logger.log(
        `finish | CnbConfigSenderAdapter | sendConfigurations | response: ${JSON.stringify(
          response.data,
        )}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        'error | CnbConfigSenderAdapter | sendConfigurations',
        error,
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
