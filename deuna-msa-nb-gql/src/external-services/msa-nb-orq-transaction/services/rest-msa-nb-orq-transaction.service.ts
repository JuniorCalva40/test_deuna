import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { IMsaNbOrqTransactionService } from '../interfaces/msa-nb-orq-transaction-service.interface';
import { InitiateDepositInput } from '../dto/msa-nb-orq-transaction-input.dto';
import { initiateDepositResponseDto } from '../dto/msa-nb-orq-transaction-response.dto';
import { AxiosError, AxiosResponse } from 'axios';

@Injectable()
export class RestMsaNbOrqTransactionService
  implements IMsaNbOrqTransactionService
{
  private readonly logger = new Logger(RestMsaNbOrqTransactionService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.getConfigValue(
      'MSA_NB_ORQ_TRANSACTION_URL',
      'http://localhost:8080',
    );
    this.retry = this.getConfigValue('httpClient.retry', 2);
    this.timeout = this.getConfigValue('httpClient.timeout', 50000);
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

  /**
   * Creates an HTTP request pipeline with common operators
   * @param observable - The source observable of type AxiosResponse
   * @returns An observable with the response data extracted
   */
  private createRequestPipeline<T>(
    observable: Observable<AxiosResponse<T>>,
  ): Observable<T> {
    return observable.pipe(
      map((response: AxiosResponse<T>) => response.data),
      retry(this.retry),
      timeout(this.timeout),
    );
  }

  /**
   * Initiates a deposit transaction.
   * @param input - The input data for the deposit transaction.
   * @returns An observable of the deposit transaction response.
   */
  initiateDeposit(
    input: InitiateDepositInput,
  ): Observable<initiateDepositResponseDto> {
    const endpoint = '/api/v1/deposit/initiate';
    const fullUrl = `${this.apiUrl}${endpoint}`;

    return this.createRequestPipeline<initiateDepositResponseDto>(
      this.httpService.post<initiateDepositResponseDto>(fullUrl, input),
    ).pipe(catchError((error) => this.handleError('initiate deposit', error)));
  }
}
