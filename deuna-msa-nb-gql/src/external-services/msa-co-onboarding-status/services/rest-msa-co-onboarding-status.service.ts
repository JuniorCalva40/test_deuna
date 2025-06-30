import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, catchError, throwError } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import {
  UpdateDataOnboardingInputDto,
  InitOnboardingInputDto,
  StartOnboardingInputDto,
  SetStepAcceptContractInputDto,
} from '../dto/msa-co-onboarding-status-input.dto';
import {
  ConfirmDataResponseDto,
  GetStateOnboardingResponseDto,
  InitOnboardingResponseDto,
  SetStepValidateOtpResponseDto,
  StartOnboardingResponseDto,
} from '../dto/msa-co-onboarding-status-response.dto';
import { IMsaCoOnboardingStatusService } from '../interfaces/msa-co-onboarding-status-service.interface';

type ClientData = {
  cnbClientId: string;
  email: string;
  companyName: string;
  ruc: string;
  businessAddress: string;
  legalRepresentative: string;
  establishment: any;
  identityId: string;
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
  ): Observable<R> {
    return request.pipe(
      map((response) =>
        transform ? transform(response.data) : (response.data as unknown as R),
      ),
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
  ): Observable<StartOnboardingResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${input.sessionId}/start-onb-cnb`;
    return this.createObservable(
      this.httpService.patch<StartOnboardingResponseDto>(fullUrl, input),
      'start onboarding',
    );
  }

  updateOnboardingState(
    confirmDataInput: UpdateDataOnboardingInputDto,
    step: string,
  ): Observable<ConfirmDataResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${confirmDataInput.sessionId}/${step}`;
    return this.createObservable(
      this.httpService.patch<ConfirmDataResponseDto>(fullUrl, confirmDataInput),
      'update onboarding state',
    );
  }

  setStepAcceptContract(
    data: SetStepAcceptContractInputDto,
  ): Observable<ConfirmDataResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${data.sessionId}/accept-contract`;
    const body = { ...data, status: 'SUCCESS' };
    return this.createObservable(
      this.httpService.patch<ConfirmDataResponseDto>(fullUrl, body),
      'set step accept contract',
    );
  }

  setStepValidateOtp(
    sessionId: string,
    otp: string,
  ): Observable<SetStepValidateOtpResponseDto> {
    const fullUrl = `${this.apiUrl}/status/${sessionId}/validate-otp`;
    const body = { status: 'SUCCESS', data: { otp } };
    return this.createObservable(
      this.httpService.patch<SetStepValidateOtpResponseDto>(fullUrl, body),
      'set step validate otp',
    );
  }

  getOnboardingState(
    sessionId: string,
  ): Observable<GetStateOnboardingResponseDto> {
    const fullUrl = `${this.apiUrl}/status/session/${sessionId}`;
    return this.createObservable(
      this.httpService.get<GetStateOnboardingResponseDto>(fullUrl, {
        headers: { 'Content-Type': 'application/json' },
      }),
      'get onboarding state',
    );
  }

  getClientDataFromStartOnboardingState(
    sessionId: string,
  ): Observable<ClientData> {
    const fullUrl = `${this.apiUrl}/status/session/${sessionId}`;

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
        identityId: responseData.identityId,
      };
    };

    return this.createObservable(
      this.httpService.get(fullUrl),
      'get client data from start onboarding state',
      transformResponse,
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
      this.httpService.patch<ConfirmDataResponseDto>(fullUrl, {
        status: 'COMPLETED',
      }),
      'set step accept contract',
    );
  }
}
