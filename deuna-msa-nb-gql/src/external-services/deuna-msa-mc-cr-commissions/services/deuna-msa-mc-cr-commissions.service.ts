import { Injectable, Logger } from '@nestjs/common';
import { IMsaMcCrCommissionsService } from '../interfaces/deuna-msa-mc-cr-commissions.interface';
import { catchError, map, Observable, throwError, retry } from 'rxjs'; // Added retry
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { SearchCommissionsInputDto } from '../dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto } from '../dto/search-commissions-response.dto';

@Injectable()
export class MsaMcCrCommissionsService implements IMsaMcCrCommissionsService {
  private readonly logger = new Logger(MsaMcCrCommissionsService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  private static readonly CHANNEL_CNB = 'CNB';
  private static readonly COMMISSIONS_BASE_PATH = '/api/v1/commissions';
  private static readonly MSA_CR_COMMISSION_SERVICE_URL_KEY =
    'MSA_CR_COMMISSION_SERVICE_URL';
  private static readonly HTTP_CLIENT_RETRY_KEY = 'httpClient.retry';
  private static readonly HTTP_CLIENT_TIMEOUT_KEY = 'httpClient.timeout';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      MsaMcCrCommissionsService.MSA_CR_COMMISSION_SERVICE_URL_KEY,
    );
    if (!this.apiUrl) {
      this.logger.error(
        `${MsaMcCrCommissionsService.MSA_CR_COMMISSION_SERVICE_URL_KEY} is no defined`,
      );
    }
    this.retry = this._getConfigNumber(
      MsaMcCrCommissionsService.HTTP_CLIENT_RETRY_KEY,
      2,
    );
    this.timeout = this._getConfigNumber(
      MsaMcCrCommissionsService.HTTP_CLIENT_TIMEOUT_KEY,
      30000,
    );
  }

  private _getConfigNumber(key: string, defaultValue: number): number {
    return Number(this.configService.get(key)) || defaultValue;
  }

  private _makeHttpRequest<T>(
    path: string,
    params?: Record<string, string>,
  ): Observable<T> {
    const fullUrl = `${this.apiUrl}${path}`;
    return this.httpService
      .get<T>(fullUrl, { params, timeout: this.timeout })
      .pipe(
        retry(this.retry), // Added retry operator
        map((response) => response.data),
        catchError((error) => {
          return throwError(() => this.handleServiceErrors(error));
        }),
      );
  }

  searchCommissions(
    merchantId: string,
    input: SearchCommissionsInputDto,
    startMonth: string,
    endMonth: string,
  ): Observable<SearchCommissionsResponseDto> {
    const params = {
      channel: MsaMcCrCommissionsService.CHANNEL_CNB,
      page: input.page.toString(),
      size: input.size.toString(),
      startMonth,
      endMonth,
    };
    const path = `${MsaMcCrCommissionsService.COMMISSIONS_BASE_PATH}/${merchantId}/search`;
    return this._makeHttpRequest<SearchCommissionsResponseDto>(path, params);
  }

  private handleServiceErrors(error: any): object {
    return {
      code:
        error.response?.status === 400
          ? ErrorCodes.MSA_CR_COMMISSIONS_SERVICE_ERROR
          : error.response?.status,
      message: error?.response?.data?.message,
      details: error?.response?.data?.details,
    };
  }
}
