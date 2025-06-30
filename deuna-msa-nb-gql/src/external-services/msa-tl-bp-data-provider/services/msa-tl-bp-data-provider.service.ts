import { Injectable, Logger } from '@nestjs/common';
import { IMsaTlBpDataProviderService } from '../interfaces/msa-tl-bp-data-provider.interface';
import { catchError, map, Observable, retry, throwError, timeout } from 'rxjs';
import { BlackListRequestDTO } from '../dto/black-list-request.dto';
import { BlackListResponseDTO } from '../dto/black-list-response.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class MsaTlBpDataProviderService implements IMsaTlBpDataProviderService {
  private readonly logger = new Logger(MsaTlBpDataProviderService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      'MSA_TL_BP_DATA_PROVIDER_SERVICE_URL',
    );

    if (!this.apiUrl) {
      this.logger.error('MSA_TL_BP_DATA_PROVIDER_SERVICE_URL is no defined');
    }

    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 30000;
  }

  validateBlacklist(
    request: BlackListRequestDTO,
  ): Observable<BlackListResponseDTO> {
    const fullUrl = `${this.apiUrl}/dataservices/blackList/bridger-insight/validate`;
    return this.httpService.post<BlackListResponseDTO>(fullUrl, request).pipe(
      map((response) => response.data),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => {
        this.logger.error(`Error validating blacklist: ${error.message}`);
        return throwError(() => this.handleServiceErrors(error));
      }),
    );
  }

  private handleServiceErrors(error: any): object {
    return {
      code:
        error.response?.status === 400
          ? ErrorCodes.TL_BP_DATA_PROVIDER_ERROR
          : error.response?.status,
      message: error?.response?.data?.message,
      details: error?.response?.data?.details,
    };
  }
}
