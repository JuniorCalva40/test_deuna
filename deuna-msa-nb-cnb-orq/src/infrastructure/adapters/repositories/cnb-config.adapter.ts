import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { firstValueFrom } from 'rxjs';
import {
  CnbConfigClientPort,
  CnbConfigResponse,
} from '../../../application/ports/out/clients/cnb-config-client.port';

@Injectable()
export class CnbConfigAdapter implements CnbConfigClientPort {
  private readonly configServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.configServiceUrl =
      this.configService.get<string>('CONFIG_SERVICE_URL');

    if (!this.configServiceUrl) {
      this.logger.error(
        'error | CnbConfigAdapter | constructor',
        'CONFIG_SERVICE_URL is not defined',
      );
      throw new Error('CONFIG_SERVICE_URL is not defined');
    }
  }

  async getCnbConfig(
    nodeId: string,
    configName: string,
  ): Promise<CnbConfigResponse | null> {
    try {
      const url = `${this.configServiceUrl}/configuration/${nodeId}/search/${configName}`;
      return await firstValueFrom(this.httpService.get<any>(url));
    } catch (error) {
      this.logger.warn(
        `error | getCnbConfig | CnbConfigClient para ${nodeId}`,
        error,
      );
      return null;
    }
  }
}
