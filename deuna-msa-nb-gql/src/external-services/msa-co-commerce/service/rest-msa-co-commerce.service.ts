import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { IMsaCoCommerceService } from '../interfaces/msa-co-commerce-service.interface';
import { DocumentInputDto } from '../dto/msa-co-commerce-input.dto';
import { CommerceResponseDto } from '../dto/msa-co-commerce-response.dto';

@Injectable()
export class RestMsaCoCommerceService implements IMsaCoCommerceService {
  private readonly logger = new Logger(RestMsaCoCommerceService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MSA_CO_COMMERCE_SERVICE_URL') ||
      'http://localhost:8080';
    if (!this.apiUrl) {
      this.logger.error('MSA_CO_COMMERCE_SERVICE_URL is not defined');
    }
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  getUserByDocument(input: DocumentInputDto): Observable<CommerceResponseDto> {
    const fullUrl = `${this.apiUrl}/microcommerce/getbyidentification/${input.identification}`;
    return this.makeRequest(fullUrl);
  }

  getUserByUsername(username: string): Observable<CommerceResponseDto> {
    const fullUrl = `${this.apiUrl}/microcommerce?username=${username}&rucDetails=true`;
    return this.makeRequest(fullUrl);
  }

  private makeRequest(url: string): Observable<CommerceResponseDto> {
    return this.httpService.get<CommerceResponseDto>(url).pipe(
      retry(this.retry),
      timeout(this.timeout),
      map((response) => response.data),
      catchError((error) => {
        this.handleError(
          error,
          'Failed to get User in RestMsaCoCommerceService',
        );
        return throwError(
          () =>
            new Error(
              `Failed to get User in RestMsaCoCommerceService: ${error.message}`,
            ),
        );
      }),
    );
  }

  private handleError(error: any, message: string): void {
    this.logger.error(`${message}: ${error.message}`, error.stack);
    if (error.response) {
      this.logger.error(`Response status: ${error.response.status}`);
      this.logger.error(
        `Response data: ${JSON.stringify(error.response.data)}`,
      );
    }
  }
}
