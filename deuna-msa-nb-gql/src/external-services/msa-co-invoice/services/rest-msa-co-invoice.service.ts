import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IMsaCoInvoiceService } from '../interfaces/msa-co-invoice-service.interface';
import { CreateAccountDto } from '../dto/create-account.dto';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { AxiosResponse } from 'axios';

@Injectable()
export class RestMsaCoInvoiceService implements IMsaCoInvoiceService {
  private readonly logger = new Logger(RestMsaCoInvoiceService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.getConfigValue(
      'MSA_CO_INVOICE_API_URL',
      'http://localhost:8080',
    );
    this.retry = this.getConfigValue('httpClient.retry', 2);
    this.timeout = this.getConfigValue('httpClient.timeout', 50000);
  }

  createAccount(accountData: CreateAccountDto): Observable<any> {
    return this.executeHttpRequest(
      'post',
      '/commerce/v1/invoice-provider/create-account',
      accountData,
      'create account',
    );
  }

  private getConfigValue<T>(key: string, defaultValue: T): T {
    const value = this.configService.get<T>(key);
    return value ?? defaultValue;
  }

  private executeHttpRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: any,
    operation = 'execute operation',
  ): Observable<T> {
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const request =
      method === 'get'
        ? this.httpService[method](fullUrl)
        : this.httpService[method](fullUrl, data);

    return request.pipe(
      map((response: AxiosResponse) => response.data),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => this.handleError(error, operation)),
    );
  }

  private handleError(error: any, operation: string): Observable<never> {
    const errorMessage = `Failed to ${operation} in RestMsaCoInvoiceService: ${error.message}`;

    this.logger.error(errorMessage);

    if (error.response) {
      this.logger.error(`Response status: ${error.response.status}`);
      this.logger.error(
        `Response data: ${JSON.stringify(error.response.data)}`,
      );
    }

    return throwError(() => new Error(errorMessage));
  }
}
