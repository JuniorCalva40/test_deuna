import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IMsaCoAuthService } from '../interfaces/msa-co-auth-service.interface';
import { GenerateOtpInputDto } from '../dto/msa-co-auth-input.dto';
import { GenerateOtpResponseDto } from '../dto/msa-co-auth-response.dto';
import { errorCodes } from '../constants/constants';
import { AxiosError } from 'axios';

interface ServiceConfig {
  apiUrl: string;
}

@Injectable()
export class RestMsaCoAuthService implements IMsaCoAuthService {
  private readonly logger = new Logger(RestMsaCoAuthService.name);
  private readonly config: ServiceConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.initializeConfig();
  }

  private initializeConfig(): ServiceConfig {
    const apiUrl = this.configService.get<string>('MSA_CO_AUTH_URL');

    if (!apiUrl) {
      this.logger.error('MSA_CO_AUTH_URL is not defined');
    }

    return {
      apiUrl,
    };
  }

  private handleError(
    operation: string,
    error: AxiosError,
    includeAttempts = false,
  ) {
    this.logger.error(
      `${operation} failed in RestMsaCoAuthService: ${error.message}`,
    );

    if (error.response) {
      this.logger.error(`Response status: ${error.response.status}`);
      this.logger.error(
        `Response data: ${JSON.stringify(error.response.data)}`,
      );
    }

    if (
      includeAttempts &&
      Array.isArray((error.response?.data as any)?.errors) &&
      (error.response?.data as any)?.errors.length > 0
    ) {
      const [errorData] = (error.response.data as any).errors;
      return throwError(() => ({
        remainingVerifyAttempts: errorCodes[errorData.code],
        message: `Failed to post ${operation} state in RestMsaCoAuthService: ${error.message}`,
      }));
    }

    return throwError(
      () =>
        new Error(
          `Failed to post ${operation} state in RestMsaCoAuthService: ${error.message}`,
        ),
    );
  }

  private createRequest<T>(
    operation: string,
    method: 'post' | 'put',
    endpoint: string,
    data: any,
    includeAttempts = false,
  ): Observable<T> {
    if (!this.config.apiUrl) {
      throw new Error('MSA_CO_AUTH_URL is not defined in the configuration');
    }

    const fullUrl = `${this.config.apiUrl}${endpoint}`;
    const request =
      method === 'post'
        ? this.httpService.post<T>(fullUrl, data, {
            headers: { 'Content-Type': 'application/json' },
          })
        : this.httpService.put<T>(fullUrl, data);

    return request.pipe(
      map((response) => response.data),
      catchError((error: AxiosError) =>
        this.handleError(operation, error, includeAttempts),
      ),
    );
  }

  validateOtp(
    businessDeviceId: string,
    requestId: string,
    otp: string,
  ): Observable<any> {
    const data = { businessDeviceId, requestId, otp };
    return this.createRequest(
      'validateOtp',
      'put',
      '/microcommerce-otp/contract/validate',
      data,
      true,
    );
  }

  generateOtp(input: GenerateOtpInputDto): Observable<GenerateOtpResponseDto> {
    const data = {
      phoneNumber: '',
      notificationChannel: ['SIGN_CONTRACT_EMAIL'],
      ...input,
    };

    return this.createRequest(
      'generateOtp',
      'post',
      '/microcommerce-otp/contract/generate',
      data,
      false,
    );
  }
}
