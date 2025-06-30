import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbSecuencePort } from '@src/application/ports/out/clients/cnb-secuence.port';

@Injectable()
export class CnbSecuenceAdapter implements CnbSecuencePort {
  private readonly logger = new Logger({
    context: CnbSecuenceAdapter.name,
  });
  private readonly apiUrl: string;
  private readonly SERVICE_NAME = 'deuna-msa-nb-cnb-orq';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('MSA_NB_CLIENT_SERVICE_URL');
    if (!this.apiUrl) {
      throw new Error('API URL MSA_NB_CLIENT_SERVICE_URL is not configured');
    }
  }

  async getSecuence(): Promise<string> {
    this.logger.log(
      `init | CnbSecuenceAdapter | getSecuence | ${this.SERVICE_NAME}`,
    );
    const url = `${this.apiUrl}/api/v1/cnb-secuence`;
    try {
      const response$ = this.httpService
        .get<{ secuence: string }>(url)
        .pipe(map((response) => response.data.secuence));
      const secuence = await firstValueFrom(response$);
      this.logger.log(
        `finish | CnbSecuenceAdapter | getSecuence | response: ${secuence}`,
      );
      return secuence;
    } catch (error) {
      this.logger.error(`Error in getSecuence: ${error.message}`, error.stack);
      throw error;
    }
  }
}
