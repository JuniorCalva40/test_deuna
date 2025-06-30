import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { IBussinesRuleService } from '../interfaces/bussines-rule-service.interface';

@Injectable()
export class RestBussinesRuleService implements IBussinesRuleService {
  private readonly logger = new Logger(RestBussinesRuleService.name);
  private readonly config: {
    apiUrl: string;
    retry: number;
    timeout: number;
  };

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.config = this.initializeConfig();
  }

  private initializeConfig() {
    return {
      apiUrl:
        this.configService.get<string>('bussinesRuleServiceUrl') ||
        'http://localhost:8080',
      retry: Number(this.configService.get('httpClient.retry')) || 2,
      timeout: Number(this.configService.get('httpClient.timeout')) || 50000,
    };
  }

  private handleError(error: any, operation: string): Observable<never> {
    this.logger.error(
      `${operation} failed in RestBussinesRuleService: ${error.message}`,
    );
    if (error.response) {
      this.logger.error(`Response status: ${error.response.status}`);
      this.logger.error(
        `Response data: ${JSON.stringify(error.response.data)}`,
      );
    }
    return throwError(
      () =>
        new Error(
          `Failed to ${operation} in RestBussinesRuleService: ${error.message}`,
        ),
    );
  }

  private createHttpRequest<T>(url: string): Observable<T> {
    return this.httpService.get(url).pipe(
      map((response) => response.data),
      retry(this.config.retry),
      timeout(this.config.timeout),
      catchError((error) => this.handleError(error, `get data from ${url}`)),
    );
  }

  getRucByIdentification(id: string): Observable<any> {
    const fullUrl = `${this.config.apiUrl}/validate-ruc?cedula=${id}`;
    return this.createHttpRequest(fullUrl);
  }
}
