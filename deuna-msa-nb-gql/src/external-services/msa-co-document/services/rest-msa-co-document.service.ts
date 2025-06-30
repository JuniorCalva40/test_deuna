import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { IMsaCoDocumentService } from '../interfaces/msa-co-document-service.interface';
import {
  GenerateDocumentDto,
  GenerateDocumentResponseDto,
  QueryDocumentInputDto,
  QueryDocumentResponseDto,
} from '../dto/msa-co-document.dto';
import { AxiosResponse } from 'axios';

@Injectable()
export class RestMsaCoDocumentService implements IMsaCoDocumentService {
  private readonly logger = new Logger(RestMsaCoDocumentService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MSA_CO_DOCUMENT_URL') ||
      'http://localhost:8080';
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  private handleHttpRequest<T>(
    endpoint: string,
    payload: any,
    operation: string,
  ): Observable<T> {
    const fullUrl = `${this.apiUrl}/api/v1/documents/${endpoint}`;
    return this.httpService.post<T>(fullUrl, payload).pipe(
      map((response: AxiosResponse<T>) => response.data),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => {
        this.logger.error(
          `${operation} failed in RestMsaCoDocumentService: ${error.message}`,
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
              `Failed to ${operation} in RestMsaCoDocumentService: ${error.message}`,
            ),
        );
      }),
    );
  }

  generateDocument(
    document: GenerateDocumentDto,
  ): Observable<GenerateDocumentResponseDto> {
    return this.handleHttpRequest<GenerateDocumentResponseDto>(
      'generate',
      document,
      'generate document',
    );
  }

  queryDocument(
    input: QueryDocumentInputDto,
  ): Observable<QueryDocumentResponseDto> {
    return this.handleHttpRequest<QueryDocumentResponseDto>(
      'query',
      input,
      'query document',
    );
  }
}
