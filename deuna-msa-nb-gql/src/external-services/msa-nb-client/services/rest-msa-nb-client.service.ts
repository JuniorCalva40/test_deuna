import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, catchError, throwError } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
import {
  IMsaNbClientService,
  UpdateClientStatusResponse,
} from '../interfaces/msa-nb-client-service.interface';
import { Client } from '../dto/client.entity';
import { CreateClientInput } from '../dto/create-client.input';
import { UploadClientsFileResponse } from '../dto/upload-client-file.entity';
import { AxiosResponse, AxiosError } from 'axios';

@Injectable()
export class RestMsaNbClientService implements IMsaNbClientService {
  private readonly logger = new Logger(RestMsaNbClientService.name);
  private apiUrl: string;
  private retry: number;
  private timeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.initializeConfig();
  }

  private initializeConfig(): void {
    this.apiUrl =
      this.configService.get<string>('MSA_NB_CLIENT_SERVICE_URL') ||
      'http://localhost:8080/api/v1';
    if (!this.apiUrl) {
      this.logger.error('MSA_NB_CLIENT_SERVICE_URL is not defined');
    }
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  private handleError(operation: string) {
    return (error: AxiosError) => {
      this.logger.error(
        `${operation} failed in RestMsaNbClientService: ${error.message}`,
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
            `Failed to ${operation} in RestMsaNbClientService: ${error.message}`,
          ),
      );
    };
  }

  private createHttpPipe<T>(operation: string) {
    return (source: Observable<AxiosResponse<T>>) =>
      source.pipe(
        map((response) => response.data),
        retry(this.retry),
        timeout(this.timeout),
        catchError(this.handleError(operation)),
      );
  }

  getClientByIdentification(id: string): Observable<Client> {
    return this.httpService
      .get<Client>(`${this.apiUrl}/clients/identification/${id}`)
      .pipe(this.createHttpPipe('get client by identification'));
  }

  createClient(payload: CreateClientInput): Observable<Client> {
    return this.httpService
      .post<Client>(`${this.apiUrl}/clients`, payload)
      .pipe(this.createHttpPipe('create client'));
  }

  updateClientComerceId(
    id: string,
    comerceId: string,
  ): Observable<UpdateClientStatusResponse> {
    return this.httpService
      .patch<UpdateClientStatusResponse>(`${this.apiUrl}/clients/${id}`, {
        comerceId,
      })
      .pipe(this.createHttpPipe('update client comerce id'));
  }

  updateClientStatus(
    clientId: string,
    status: string,
  ): Observable<UpdateClientStatusResponse> {
    return this.httpService
      .patch<UpdateClientStatusResponse>(`${this.apiUrl}/clients/${clientId}`, {
        status,
      })
      .pipe(this.createHttpPipe('update client status'));
  }

  uploadClientsFile(file: string): Observable<UploadClientsFileResponse> {
    return this.httpService
      .post(`${this.apiUrl}/file/csv`, { file })
      .pipe(this.createHttpPipe('upload clients file'));
  }
}
