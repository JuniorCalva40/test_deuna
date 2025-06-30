import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { IMsaCoTransferOrchestrationService } from '../interfaces/msa-co-transfer-orchestration-service.interface';
import { ValidateBalanceInput } from '../dto/msa-co-transfer-orchestration-input.dto';
import { ValidateBalanceResponse } from '../dto/msa-co-transfer-orchestration-response.dto';
import { AxiosResponse } from 'axios';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RestMsaCoTransferOrchestrationService
  implements IMsaCoTransferOrchestrationService
{
  private readonly logger = new Logger(
    RestMsaCoTransferOrchestrationService.name,
  );
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MSA_CO_TRANSFER_ORCHESTRATION_URL') ||
      'http://localhost:8080';
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  /**
   * Get data for a QR.
   * @param accountId - The accountId for the get balance request.
   * @returns An observable of the get balance request response.
   */
  validateBalance(
    input: ValidateBalanceInput,
  ): Observable<ValidateBalanceResponse> {
    const endpoint = `/transfer-orchestration/balance/${input.accountId}`;
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const context = 'MsaCoTransferOrchestrationService';
    const className = RestMsaCoTransferOrchestrationService.name;
    const methodName = 'validateBalance';
    const method = 'GET';
    const traceId = uuidv4();
  
    HttpLoggerUtil.logRequest({
      context,
      className,
      methodName,
      url: fullUrl,
      method,
      params: { accountId: input.accountId },
      traceId,
    });
  
    return this.httpService.get<ValidateBalanceResponse>(fullUrl).pipe(
      map((response: AxiosResponse<ValidateBalanceResponse>) => {
        HttpLoggerUtil.logResponse({
          context,
          className,
          methodName,
          url: fullUrl,
          method,
          response: response.data,
          traceId,
        });
        return response.data;
      }),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => {
        const errorMessage = `Failed to validate balance in ${className}: ${error.message}`;
        this.logger.error(errorMessage);
  
        if (error.response) {
          this.logger.error(`Response status: ${error.response.status}`);
          this.logger.error(
            `Response data: ${JSON.stringify(error.response.data)}`,
          );
        }
  
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
