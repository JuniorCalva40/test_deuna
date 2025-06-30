import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ClientDataInput,
  ClientDataResponse,
} from '../dto/msa-mc-bo-client.dto';
import { IMsaMcBoClientService } from '../interfaces/msa-mc-bo-client.interface';
import { ConfigService } from '@nestjs/config';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RestMsaMcBoClientService implements IMsaMcBoClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  getClientData(input: ClientDataInput): Observable<ClientDataResponse> {
    const apiUrl = this.configService.get<string>('MSA_MC_BO_CLIENT_SERVICE_URL');

    if (!apiUrl) {
      throw new Error('MSA_MC_BO_CLIENT_SERVICE_URL is not defined');
    }

    const fullUrl = `${apiUrl}/client/ruc/${input.identification}`;
    const context = 'MsaMcBoClientService';
    const className = RestMsaMcBoClientService.name;
    const methodName = 'getClientData';
    const method = 'GET';
    const traceId = uuidv4();

    HttpLoggerUtil.logRequest({
      context,
      className,
      methodName,
      url: fullUrl,
      method,
      params: { identification: input.identification },
      traceId,
    });

    return this.httpService
      .get<ClientDataResponse>(fullUrl)
      .pipe(
        map((response) => {
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
      );
  }
}
