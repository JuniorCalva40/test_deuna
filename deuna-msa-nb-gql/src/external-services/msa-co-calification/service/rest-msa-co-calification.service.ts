import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CalificationInput,
  CalificationResponse,
} from '../dto/msa-co-calification.dto';
import { IMsaCoCalificationService } from '../interfaces/msa-co-calification-service.interface';
import { ConfigService } from '@nestjs/config';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RestMsaCoCalificationService implements IMsaCoCalificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  sendCalification(input: CalificationInput): Observable<CalificationResponse> {
    const apiUrl = this.configService.get<string>('MSA_CO_CALIFICATION_URL');

    if (!apiUrl) {
      throw new Error('MSA_CO_CALIFICATION_URL is not defined');
    }

    const fullUrl = `${apiUrl}/api/v1/feedback`;
    const context = 'MsaCoCalificationService';
    const className = RestMsaCoCalificationService.name;
    const methodName = 'sendCalification';
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

    return this.httpService.post<CalificationResponse>(fullUrl, input).pipe(
      map((response) => {
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
    );
  }
}
