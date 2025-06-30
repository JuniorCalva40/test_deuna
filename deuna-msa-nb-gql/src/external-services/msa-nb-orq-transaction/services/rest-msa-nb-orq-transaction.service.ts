import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { IMsaNbOrqTransactionService } from '../interfaces/msa-nb-orq-transaction-service.interface';
import { AxiosError, AxiosResponse } from 'axios';
import { ValidateDepositAccountInputDto } from '../dto/validate-deposit-account-input.dto';
import { ValidateDepositAccountResponseDto } from '../dto/validate-deposit-account-response.dto';
import { InitiateCellPhoneDepositInputDto } from '../dto/initiate-cellphone-deposit-input.dto';
import { InitiateCellPhoneDepositResponseDto } from '../dto/initiate-cellphone-deposit-response.dto';
import { GenerateQrInputDto } from '../dto/generate-qr-input.dto';
import { GenerateQrResponseDto } from '../dto/generate-qr-response.dto';
import { ExecuteDepositInputDto } from '../dto/execute-deposit-input.dto';
import { ExecuteDepositResponseDto } from '../dto/execute-deposit-response.dto';
import { ConfirmDepositInputDto } from '../dto/confirm-deposit-input.dto';
import { ConfirmDepositResponseDto } from '../dto/confirm-deposit-response.dto';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';

@Injectable()
export class RestMsaNbOrqTransactionService
  implements IMsaNbOrqTransactionService {
  private readonly logger = new Logger(RestMsaNbOrqTransactionService.name);
  private readonly apiUrl: string;
  private readonly retryAttempts: number;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.getConfigValue(
      'MSA_NB_ORQ_TRANSACTION_URL',
      'http://localhost:8080',
    );
    this.retryAttempts = this.getConfigValue('httpClient.retry', 2);
    this.timeoutMs = this.getConfigValue('httpClient.timeout', 50000);
  }

  /**
   * Gets a configuration value with a default fallback
   * @param key - Configuration key to retrieve
   * @param defaultValue - Default value if key is not found
   * @returns The configuration value or default
   */
  private getConfigValue<T>(key: string, defaultValue: T): T {
    const value = this.configService.get<T>(key);
    return value ?? defaultValue;
  }

  /**
   * Generic error handler for HTTP requests
   * @param operation - Name of the operation that failed
   * @param error - The error that occurred
   * @returns An observable that errors with a formatted error message
   */
  private handleError(operation: string, error: AxiosError): Observable<never> {
    const errorMessage = `Failed to ${operation} in RestMsaNbOrqTransactionService: ${error.message}`;

    this.logger.error(errorMessage);

    if (error.response) {
      this.logger.error(`Response status: ${error.response.status}`);
      this.logger.error(
        `Response data: ${JSON.stringify(error.response.data)}`,
      );
    }

    return throwError(() => new Error(errorMessage));
  }

  protected handleGraphQlError(
    operation: string,
    error: AxiosError,
  ): Observable<never> {
    const statusCode = error.response?.status || 500;
    const responseData = error.response?.data;
    const errorCode = statusCode === 400 ? 'NB_ERR_400' : 'NB_ERR_905';

    let extractedMessage = error.message;

    if (typeof responseData === 'string') {
      extractedMessage = responseData;
    } else if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof (responseData as any).message === 'string'
    ) {
      extractedMessage = (responseData as any).message;
    } else if (
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof (responseData as any).error === 'string'
    ) {
      extractedMessage = (responseData as any).error;
    }

    const formattedMessage = `[${operation.toUpperCase()}] ${extractedMessage}`;

    this.logger.error(`${formattedMessage}`);
    this.logger.error(`Status code: ${statusCode}`);
    this.logger.error(`Response data: ${JSON.stringify(responseData)}`);

    const customError = new Error(formattedMessage) as any;

    customError.error_code = errorCode;
    customError.context = operation.toLowerCase().replace(/\s/g, '-');
    customError.details = {
      status: 'ERROR',
      errors: [
        {
          message: formattedMessage,
          code: errorCode,
        },
      ],
    };

    return throwError(() => customError);
  }

  /**
   * Creates an HTTP request pipeline with common operators
   * @param observable - The source observable of type AxiosResponse
   * @returns An observable with the response data extracted
   */
  private createRequestPipeline<T>(
    observable: Observable<AxiosResponse<T>>,
    logInfo?: {
      context: string;
      className: string;
      methodName: string;
      url: string;
      method: string;
      headers?: any;
      payload?: any;
      traceId?: string;
    }
  ): Observable<T> {
    if (logInfo) {
      HttpLoggerUtil.logRequest({
        context: logInfo.context,
        className: logInfo.className,
        methodName: logInfo.methodName,
        url: logInfo.url,
        method: logInfo.method,
        headers: logInfo.headers,
        payload: logInfo.payload,
        traceId: logInfo.traceId,
      });
    }

    return observable.pipe(
      retry({ count: this.retryAttempts }),
      map((response: AxiosResponse<T>) => {
        if (logInfo) {
          HttpLoggerUtil.logResponse({
            context: logInfo.context,
            className: logInfo.className,
            methodName: logInfo.methodName,
            url: logInfo.url,
            method: logInfo.method,
            response: response.data,
            traceId: logInfo.traceId,
          });
        }
        return response.data;
      }),
    );
  }

  /**
   * Generates a QR code for a transaction
   * @param input - The input data for generating the QR code
   * @returns An observable of the QR code generation response
   */
  generateQr(input: GenerateQrInputDto): Observable<GenerateQrResponseDto> {
    const endpoint = '/qr/generate';
    const fullUrl = `${this.apiUrl}${endpoint}`;

    return this.createRequestPipeline<GenerateQrResponseDto>(
      this.httpService.post<GenerateQrResponseDto>(fullUrl, input),
    ).pipe(catchError((error) => this.handleError('generate QR code', error)));
  }

  /**
   * Validate deposit account.
   * @param input - The input data to Validate deposit account.
   * @returns An observable of the Validate deposit account response.
   */
  validateDepositAccount(
    input: ValidateDepositAccountInputDto,
  ): Observable<ValidateDepositAccountResponseDto> {
    const endpoint = '/deposit/validate-deposit-account';
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const timeoutDuration = 30000;

    const { trackingId, beneficiaryPhoneNumber } = input;

    const body = {
      beneficiaryPhoneNumber,
    };

    const request$ = this.httpService
      .post<ValidateDepositAccountResponseDto>(fullUrl, body)
      .pipe(timeout(timeoutDuration));

    return this.createRequestPipeline<ValidateDepositAccountResponseDto>(
      request$.pipe(
        catchError((error) =>
          this.handleGraphQlError('validate deposit account', error),
        ),
      ),
      {
        context: 'MsaNbOrqTransactionService',
        className: RestMsaNbOrqTransactionService.name,
        methodName: 'validateDepositAccount',
        url: fullUrl,
        method: 'POST',
        payload: body,
        traceId: trackingId,
      }
    );
  }

  /**
   * Initiate cellphone deposit.
   * @param input - The input data to Initiate cellphone deposit.
   * @returns An observable of the Initiate celllphone deposit response.
   */
  initiateCellPhoneDeposit(
    input: InitiateCellPhoneDepositInputDto,
  ): Observable<InitiateCellPhoneDepositResponseDto> {
    const endpoint = '/deposit/initiate-cellphone-deposit';
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const timeoutDuration = 30000;

    const request$ = this.httpService
      .post<InitiateCellPhoneDepositResponseDto>(fullUrl, input)
      .pipe(timeout(timeoutDuration));

    return this.createRequestPipeline<InitiateCellPhoneDepositResponseDto>(
      request$.pipe(
        catchError((error) =>
          this.handleGraphQlError('initiate cellphone deposit', error),
        ),
      ),
      {
        context: 'MsaNbOrqTransactionService',
        className: RestMsaNbOrqTransactionService.name,
        methodName: 'initiateCellPhoneDeposit',
        url: fullUrl,
        method: 'POST',
        payload: input,
        traceId: input.trackingId,
      }
    );
  }

  /**
   * Executes a deposit transaction
   * @param input - The input data for executing the deposit
   * @returns An observable of the execute deposit response
   */
  executeDeposit(
    input: ExecuteDepositInputDto,
  ): Observable<ExecuteDepositResponseDto> {
    const endpoint = '/deposit/execute-deposit';
    const fullUrl = `${this.apiUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      trackingId: input.trackingId || 'default-tracking-id',
    };

    const request$ = this.httpService.post<ExecuteDepositResponseDto>(
      fullUrl,
      input,
      { headers }
    );

    return this.createRequestPipeline<ExecuteDepositResponseDto>(
      request$.pipe(
        catchError((error) => this.handleError('execute deposit', error)),
      ),
      {
        context: 'MsaNbOrqTransactionService',
        className: RestMsaNbOrqTransactionService.name,
        methodName: 'executeDeposit',
        url: fullUrl,
        method: 'POST',
        payload: input,
        traceId: input.trackingId,
        headers,
      }
    );
  }

  /**
   * Confirm deposit.
   * @param input - The input data to Confirm deposit.
   * @returns An observable of the Confirm deposit response.
   */
  confirmDeposit(
    input: ConfirmDepositInputDto,
  ): Observable<ConfirmDepositResponseDto> {
    const endpoint = '/deposit/confirm-deposit';
    const fullUrl = `${this.apiUrl}${endpoint}`;

    const { trackingId, transactionId, deviceId } = input;

    const headers = {
      'Content-Type': 'application/json',
      trackingId: trackingId || 'default-tracking-id',
    };

    const body = {
      transactionId,
      deviceId,
    };

    const request$ = this.httpService.post<ConfirmDepositResponseDto>(
      fullUrl,
      body,
      { headers },
    );

    return this.createRequestPipeline<ConfirmDepositResponseDto>(
      request$.pipe(
        catchError((error) =>
          this.handleGraphQlError('confirm deposit', error),
        ),
      ),
      {
        context: 'MsaNbOrqTransactionService',
        className: RestMsaNbOrqTransactionService.name,
        methodName: 'confirmDeposit',
        url: fullUrl,
        method: 'POST',
        payload: body,
        headers,
        traceId: trackingId,
      }
    );
  }
}
