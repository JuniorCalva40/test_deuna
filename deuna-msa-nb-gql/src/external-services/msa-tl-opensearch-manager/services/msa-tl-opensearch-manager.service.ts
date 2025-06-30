import { Injectable, Logger } from '@nestjs/common';
import { IMsaTlOpensearchManagerService } from '../interfaces/msa-tl-opensearch-manager.interface';
import { catchError, map, Observable, retry, throwError, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GetCnbTransactionsInputdto } from '../dto/get-transactions-input.dto';
import { GetCnbTransactionsResponseDto } from '../dto/get-transactions-reponse.dto';
import {
  TransactionChannelId,
  TransactionChannelType,
} from '../../../common/constants/common';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class MsaTlOpensearchManagerService
  implements IMsaTlOpensearchManagerService
{
  private readonly logger = new Logger(MsaTlOpensearchManagerService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpSetvice: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      'MSA_TL_OPENSEARCH_MANAGER_SERVICE_URL',
    );
    if (!this.apiUrl) {
      this.logger.error('MSA_TL_OPENSEARCH_MANAGER_SERVICE_URL is no defined');
    }
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 30000;
  }

  getCnbTransactions(
    input: GetCnbTransactionsInputdto,
    merchantId: string,
  ): Observable<GetCnbTransactionsResponseDto> {
    const params = this.buildQueryParams(input);
    const fullUrl = `${this.apiUrl}/api/v1/opensearch/${merchantId}/transactions?${params}`;
    return this.httpSetvice.get<GetCnbTransactionsResponseDto>(fullUrl).pipe(
      map((response) => response.data),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => {
        return throwError(() => this.handleServiceErrors(error));
      }),
    );
  }

  getMonthlyCommissionSummary(
    merchantId: string,
    startMonth: string,
    endMonth: string,
  ): Observable<any> {
    const params = {
      startMonth,
      endMonth,
      channel: 'CNB',
    };

    const fullUrl = `${this.apiUrl}/api/v1/commissions/${merchantId}`;

    return this.httpSetvice.get(fullUrl, { params }).pipe(
      map((response) => response.data),
      catchError((error) => {
        return throwError(() => this.handleServiceErrors(error));
      }),
    );
  }

  private buildQueryParams(params: GetCnbTransactionsInputdto): string {
    const orderedKeys = [
      'fromDate',
      'toDate',
      'transactionChannelId',
      'page',
      'size',
    ];

    params.transactionChannelId = this.hendleTransactionChannelId(
      params.transacitonType,
    ) as any;

    return orderedKeys
      .map((key) => {
        const value = params[key];
        const val = Array.isArray(value) ? value.join(',') : value;
        return `${key}=${val}`;
      })
      .join('&');
  }

  private handleServiceErrors(error: any): object {
    return {
      code:
        error.response?.status === 400
          ? ErrorCodes.TL_OPENSEARCH_ERROR
          : error.response?.status,
      message: error?.response?.data?.message,
      details: error?.response?.data?.details,
    };
  }

  private hendleTransactionChannelId(
    transactionChannelId: TransactionChannelType,
  ): TransactionChannelId[] {
    switch (transactionChannelId) {
      case TransactionChannelType.DEPOSIT:
        return [TransactionChannelId.INTTRANFERDEPOSITOCNBS];
      case TransactionChannelType.WITHDRAWAL:
        return [
          TransactionChannelId.INTTRANFERRETIROCNBS,
          TransactionChannelId.INTTRANFERRETIROCNBSCOM,
          TransactionChannelId.INTTRANFERRETIROCNBSTAX,
        ];
      default:
        return [
          TransactionChannelId.INTTRANFERRETIROCNBS,
          TransactionChannelId.INTTRANFERRETIROCNBSCOM,
          TransactionChannelId.INTTRANFERRETIROCNBSTAX,
          TransactionChannelId.INTTRANFERDEPOSITOCNBS,
        ];
    }
  }
}
