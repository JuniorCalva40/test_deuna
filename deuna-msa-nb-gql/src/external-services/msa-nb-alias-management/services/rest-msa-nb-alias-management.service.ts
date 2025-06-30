import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { AxiosError, AxiosResponse } from 'axios';
import { IMsaNbAliasManagementService } from '../interfaces/msa-nb-alias-management-service.interface';
import { GenerateDynamicQrInputDto } from '../dto/generate-dynamic-qr-input.dto';
import { CreateDynamicQrResponseDto } from '../dto/create-dynamic-qr-response.dto';
import { GetDynamicQrResponseDto } from '../dto/get-dynamic-qr-response.dto';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RestMsaNbAliasManagementService
  implements IMsaNbAliasManagementService
{
  private readonly logger = new Logger(RestMsaNbAliasManagementService.name);
  private readonly apiUrl: string;
  private readonly retryAttempts: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      'MSA_NB_ALIAS_MANAGEMENT_URL',
      'msa-nb-alias-management',
    );
    this.retryAttempts = this.configService.get<number>('httpClient.retry', 2);
  }

  generateDynamicQr(
    input: GenerateDynamicQrInputDto,
  ): Observable<CreateDynamicQrResponseDto> {
    const endpoint = '/api/v1/cnb/qr';
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const context = 'MsaNbAliasManagementService';
    const className = RestMsaNbAliasManagementService.name;
    const methodName = 'generateDynamicQr';
    const method = 'POST';
    const traceId = uuidv4();

    HttpLoggerUtil.logRequest({
      context,
      className,
      methodName,
      url: fullUrl,
      method,
      payload: input,
      traceId: traceId,
    });

    return this.httpService
      .post<CreateDynamicQrResponseDto>(fullUrl, input)
      .pipe(
        map((response: AxiosResponse<CreateDynamicQrResponseDto>) => {
          HttpLoggerUtil.logResponse({
            context,
            className,
            methodName,
            url: fullUrl,
            method,
            response: response.data,
            traceId: traceId,
          });
          return response.data;
        }),
        retry(this.retryAttempts),
        catchError((error: AxiosError) => {
          const errorMessage = `Failed to generate dynamic QR code: ${error.message}`;
          this.logger.error(errorMessage, error.stack);
          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  getDynamicQr(transactionId: string): Observable<GetDynamicQrResponseDto> {
    const endpoint = `/api/v1/cnb/qr/${transactionId}`;
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const context = 'MsaNbAliasManagementService';
    const className = RestMsaNbAliasManagementService.name;
    const methodName = 'getDynamicQr';
    const method = 'GET';
    const traceId = uuidv4();

    HttpLoggerUtil.logRequest({
      context,
      className,
      methodName,
      url: fullUrl,
      method,
      params: { transactionId },
      traceId: traceId,
    });

    return this.httpService.get<GetDynamicQrResponseDto>(fullUrl).pipe(
      map((response: AxiosResponse<GetDynamicQrResponseDto>) => {
        HttpLoggerUtil.logResponse({
          context,
          className,
          methodName,
          url: fullUrl,
          method,
          response: response.data,
          traceId: traceId,
        });
        return response.data;
      }),
      retry(this.retryAttempts),
      catchError((error: AxiosError) => {
        const errorMessage = `Failed to fetch dynamic QR code: ${error.message}`;
        this.logger.error(errorMessage, error.stack);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
