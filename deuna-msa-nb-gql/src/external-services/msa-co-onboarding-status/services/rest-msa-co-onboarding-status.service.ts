import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, catchError, throwError } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import {
  DocumentValidationInputDto,
  FingeprintCodeInputDto,
  UpdateDataOnboardingInputDto,
  InitOnboardingInputDto,
  StartOnboardingInputDto,
  SetStepAcceptContractInputDto,
} from '../dto/msa-co-onboarding-status-input.dto';
import {
  GetStateOnboardingResponseDto,
  InitOnboardingResponseDto,
  GetAllOnboardingResponseDto,
  OnboardingStatusResponseDto,
} from '../dto/msa-co-onboarding-status-response.dto';
import { IMsaCoOnboardingStatusService } from '../interfaces/msa-co-onboarding-status-service.interface';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';

type ClientData = {
  cnbClientId: string;
  email: string;
  companyName: string;
  ruc: string;
  businessAddress: string;
  legalRepresentative: string;
  establishment: any;
  identityId: string;
  username: string;
  commerceId: string;
  trackingId: string;
  status: string;
};

type OtpData = {
  otp: string;
};

/**
 * Service for managing the onboarding status of Deuna Msa Co.
 */
@Injectable()
export class RestMsaCoOnboardingStatusService
  implements IMsaCoOnboardingStatusService
{
  private readonly logger = new Logger(RestMsaCoOnboardingStatusService.name);
  private readonly apiUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('MSA_CO_ONBOARDING_STATUS_URL') ||
      'http://localhost:8080';
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  private handleHttpError(methodName: string, error: any) {
    this.logger.error(
      `${methodName} failed in RestMsaCoOnboardingStatusService: ${error.message}`,
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
          `Failed to ${methodName} in RestMsaCoOnboardingStatusService: ${
            error?.response?.data?.message || error.message
          }`,
        ),
    );
  }

  private createObservable<T, R = T>(
    request: Observable<AxiosResponse<T>>,
    methodName: string,
    transform?: (data: T) => R,
    logInfo?: {
      context: string;
      className: string;
      url: string;
      method: string;
      traceId?: string;
      headers?: any;
      params?: any;
      payload?: any;
    }
  ): Observable<R> {
    if (logInfo) {
      HttpLoggerUtil.logRequest({
        context: logInfo.context,
        className: logInfo.className,
        methodName,
        url: logInfo.url,
        method: logInfo.method,
        headers: logInfo.headers,
        params: logInfo.params,
        payload: logInfo.payload,
        traceId: logInfo.traceId,
      });
    }
  
    return request.pipe(
      map((response) => {
        if (logInfo) {
          HttpLoggerUtil.logResponse({
            context: logInfo.context,
            className: logInfo.className,
            methodName,
            url: logInfo.url,
            method: logInfo.method,
            response: response.data,
            traceId: logInfo.traceId,
          });
        }
  
        return transform ? transform(response.data) : (response.data as unknown as R);
      }),
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => this.handleHttpError(methodName, error)),
    );
  }

  initOnboarding(
    input: InitOnboardingInputDto,
  ): Observable<InitOnboardingResponseDto> {
    const fullUrl = `${this.apiUrl}/status`;
    return this.createObservable(
      this.httpService.post<InitOnboardingResponseDto>(fullUrl, input),
      'initiate onboarding',
    );
  }

  startOnboarding(
    input: StartOnboardingInputDto,
  ): Observable<OnboardingStatusResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${input.sessionId}/start-onb-cnb`;
    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, input),
      'start onboarding',
    );
  }

  updateOnboardingState(
    confirmDataInput: UpdateDataOnboardingInputDto,
    step: string,
  ): Observable<OnboardingStatusResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${confirmDataInput.sessionId}/${step}`;
    const context = 'MsaCoOnboardingStatusService';
    const className = RestMsaCoOnboardingStatusService.name;
    const methodName = 'updateOnboardingState';
    const method = 'PATCH';
    const traceId = confirmDataInput.sessionId;
  
    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, confirmDataInput),
      methodName,
      undefined,
      {
        context,
        className,
        url: fullUrl,
        method,
        traceId,
        payload: confirmDataInput,
      },
    );
  }

  setStepAcceptContract(
    data: SetStepAcceptContractInputDto,
  ): Observable<OnboardingStatusResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${data.sessionId}/accept-contract`;
    const body = { ...data, status: 'SUCCESS' };
    const methodName = 'set step accept contract';
  
    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, body),
      methodName,
      undefined,
      {
        context: 'MsaCoOnboardingStatusService',
        className: RestMsaCoOnboardingStatusService.name,
        url: fullUrl,
        method: 'PATCH',
        traceId: data.sessionId,
        payload: body,
      },
    );
  }

  /**
   * Método que llama a la operación patch del servicio msa-co-onmboarding-status
   * para el step fingerprint
   * @param data
   * @returns StoreFingerprintDataResponseDto
   */
  setFingerprintStep(
    data: FingeprintCodeInputDto,
  ): Observable<OnboardingStatusResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${data.sessionId}/fingerprint`;
    const body = { status: data.status, data: data.data };
    const methodName = 'store finger print code';
  
    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, body),
      methodName,
      undefined,
      {
        context: 'MsaCoOnboardingStatusService',
        className: RestMsaCoOnboardingStatusService.name,
        url: fullUrl,
        method: 'PATCH',
        payload: body,
        traceId: data.sessionId,
      },
    );
  }

  /**
   * Método que llama a la operación patch del servicio msa-co-onmboarding-status
   * para el step facephi-morphology donde almacena las imágenes fronty back del DNI
   * @param data
   * @returns
   */
  setDocumentValidationStep(
    data: DocumentValidationInputDto,
  ): Observable<OnboardingStatusResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${data.sessionId}/facephi-morphology`;
    const body = {
      status: data.status,
      data: {
        frontsideImage: data.data.frontsideImage,
        backsideImage: data.data.backsideImage,
        scanReference: data.data.scanReference,
        timestamp: data.data.timestamp,
        type: data.data.type,
      },
    };
    const methodName = 'store document validation';
    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, body),
      methodName,
      undefined,
      {
        context: 'MsaCoOnboardingStatusService',
        className: RestMsaCoOnboardingStatusService.name,
        url: fullUrl,
        method: 'PATCH',
        payload: body,
        traceId: data.sessionId,
      },
    );
  }

  setStepValidateOtp(
    sessionId: string,
    otp: string,
  ): Observable<OnboardingStatusResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${sessionId}/validate-otp`;
    const body = { otp: otp };
    const methodName = 'set step validate otp';
    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, body),
      methodName,
      undefined,
      {
        context: 'MsaCoOnboardingStatusService',
        className: RestMsaCoOnboardingStatusService.name,
        url: fullUrl,
        method: 'PATCH',
        traceId: sessionId,
      },
    );
  }

  getOnboardingState(
    sessionId: string,
  ): Observable<GetStateOnboardingResponseDto> {
    const fullUrl = `${this.apiUrl}/status/session/${sessionId}`;
    return this.createObservable(
      this.httpService.get<GetStateOnboardingResponseDto>(fullUrl),
      'getOnboardingState',
      undefined,
      {
        context: 'MsaCoOnboardingStatusService',
        className: RestMsaCoOnboardingStatusService.name,
        url: fullUrl,
        method: 'GET',
        params: { sessionId },
        traceId: sessionId,
      },
    );
  }

  getCompleteOnboardingStatus(
    sessionId: string,
  ): Observable<GetAllOnboardingResponseDto> {
    const fullUrl = `${this.apiUrl}/status/session/${sessionId}`;

    return this.createObservable(
      this.httpService.get<GetAllOnboardingResponseDto>(fullUrl),
      'get complete onboarding status',
    );
  }

  getClientDataFromStartOnboardingState(
    sessionId: string,
  ): Observable<ClientData> {
    const fullUrl = `${this.apiUrl}/status/session/${sessionId}`;
    const methodName = 'get client data from start onboarding state';
  
    const transformResponse = (responseData: any): ClientData => {
      const startOnbCnbData = responseData.data['start-onb-cnb'].data;
      return {
        cnbClientId: startOnbCnbData.cnbClientId,
        email: startOnbCnbData.email,
        companyName: startOnbCnbData.companyName,
        ruc: startOnbCnbData.ruc,
        businessAddress: startOnbCnbData.businessAddress,
        legalRepresentative: startOnbCnbData.legalRepresentative,
        establishment: startOnbCnbData.establishment,
        username: startOnbCnbData.username,
        commerceId: startOnbCnbData.commerceId,
        trackingId: startOnbCnbData.trackingId,
        identityId: responseData.identityId,
        status: responseData.status,
      };
    };
  
    return this.createObservable(
      this.httpService.get(fullUrl),
      methodName,
      transformResponse,
      {
        context: 'MsaCoOnboardingStatusService',
        className: RestMsaCoOnboardingStatusService.name,
        url: fullUrl,
        method: 'GET',
        params: { sessionId },
        traceId: sessionId,
      },
    );
  }

  getOtpDataFromValidateOtpState(sessionId: string): Observable<OtpData> {
    const fullUrl = `${this.apiUrl}/status/session/${sessionId}`;

    const transformResponse = (responseData: any): OtpData => {
      const otpStateData = responseData.data['validate-otp'].data;
      return {
        otp: otpStateData.otp,
      };
    };

    return this.createObservable(
      this.httpService.get(fullUrl),
      'get client data from otp validation state',
      transformResponse,
    );
  }

  /**
   * Completes the onboarding process for a given session.
   * @param sessionId - The ID of the session to complete
   * @returns Observable with the completion response
   */
  completeOnboarding(sessionId: string): Observable<any> {
    if (!this.apiUrl) {
      throw new Error(
        'MSA_CO_ONBOARDING_STATUS_URL is not defined in the configuration',
      );
    }

    const fullUrl = `${this.apiUrl}/status/${sessionId}`;

    return this.createObservable(
      this.httpService.patch<OnboardingStatusResponseDto>(fullUrl, {
        status: 'COMPLETED',
      }),
      'complete onboarding',
    );
  }
}
