import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  Observable,
  catchError,
  firstValueFrom,
  from,
  map,
  throwError,
  retry,
  timeout,
} from 'rxjs';
import { IMsaNbCnbOrqService } from '../interfaces/msa-nb-cnb-orq-service.interface';
import {
  BiometricValidationInputDto,
  DocumentValidationInputDto,
  NotifyOnboardingFinishInputDto,
  IElectronicSignatureDataRequest,
  CombinedBiometricValidationInputDto,
  BlackListValidationRequest,
  BlackListValidationResponse,
  GenerateDocumentDto,
  QueryDocumentInputDto,
} from '../dto/msa-nb-cnb-orq-input.dto';
import {
  BiometricValidationResponseDto,
  DocumentValidationResponseDto,
  ElectronicSignatureProcessResponseDto,
  ISaveElectronicSignatureResponseRedis,
  GenerateDocumentResponseDto,
  QueryDocumentResponseDto,
} from '../dto/msa-nb-cnb-orq-response.dto';
import { TrackingBaseDto } from '../../../common/constants/common';
import { formatLogger } from '../../../utils/format-logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { Logger } from '@deuna/tl-logger-nd';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { v4 as uuidv4 } from 'uuid';
import { HttpLoggerUtil } from '../../../utils/http-logger.util';
import { AxiosResponse } from 'axios';

@Injectable()
export class RestMsaNbCnbOrqService implements IMsaNbCnbOrqService {
  private readonly ONBOARDING_FINISH_TOPIC = 'cnb.cnb.complete';

  private readonly logger = new Logger({
    context: RestMsaNbCnbOrqService.name,
  });
  private readonly baseUrl: string;
  private readonly retry: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
  ) {
    this.baseUrl = this.configService.get<string>('MSA_NB_CNB_ORQ_URL');
    if (!this.baseUrl) {
      throw new Error('MSA_NB_CNB_ORQ_URL is not defined');
    }
    this.retry = Number(this.configService.get('httpClient.retry')) || 2;
    this.timeout =
      Number(this.configService.get('httpClient.timeout')) || 50000;
  }

  startBiometricValidation(
    input: BiometricValidationInputDto,
    tracking: TrackingBaseDto,
  ): Observable<BiometricValidationResponseDto> {
    formatLogger(
      this.logger,
      'info',
      'Starting morphology validation process into msa-nb-cnb-orq service url: ' +
        `${this.baseUrl}/api/v1/cnb/kyc`,
      tracking.sessionId,
      tracking.trackingId,
      tracking.requestId,
    );

    const combinedBiometricValidationInputDto: CombinedBiometricValidationInputDto =
      {
        facialValidation: {
          token1: input.facialAndLivenessValidation.token1,
          token2: input.facialAndLivenessValidation.token2,
          method: input.facialAndLivenessValidation.method,
        },
        livenessValidation: {
          imageBuffer: input.facialAndLivenessValidation.token1,
        },
        onboardingSessionId: input.onboardingSessionId,
      };

    // Headers with both formats for compatibility
    const headers = {
      'x-tracking-id': tracking.trackingId,
      'x-request-id': tracking.requestId,
      'x-session-id': tracking.sessionId,
      trackingid: tracking.trackingId,
      requestid: tracking.requestId,
      sessionid: tracking.sessionId,
    };

    return this.httpService
      .post<BiometricValidationResponseDto>(
        `${this.baseUrl}/api/v1/cnb/kyc`,
        combinedBiometricValidationInputDto,
        { headers },
      )
      .pipe(
        map((response) => {
          formatLogger(
            this.logger,
            'info',
            `Morphology validation process initiated with scanId: ${response.data.scanId}`,
            tracking.sessionId,
            tracking.trackingId,
            tracking.requestId,
          );
          return response.data;
        }),
        catchError((error) => {
          formatLogger(
            this.logger,
            'error',
            `Error in morphology validation process: ${error.message}`,
            tracking.sessionId,
            tracking.trackingId,
            tracking.requestId,
          );

          const errorCode =
            error.response?.status === 400
              ? ErrorCodes.MORPHOLOGY_DATA_INVALID
              : error.response?.status === 408
                ? ErrorCodes.MORPHOLOGY_REQUEST_TIMEOUT
                : ErrorCodes.MORPHOLOGY_SERVICE_ERROR;

          return throwError(() => ({
            code: errorCode,
            message: `Failed to validate morphology into msa-nb-cnb-orq url: ${this.baseUrl}/api/v1/cnb/kyc: ${error.message}`,
            details: error.response?.data,
          }));
        }),
      );
  }

  documentValidation(
    input: DocumentValidationInputDto,
    tracking: TrackingBaseDto,
  ): Observable<DocumentValidationResponseDto> {
    formatLogger(
      this.logger,
      'info',
      'Starting document validation process into msa-nb-cnb-orq service url: ' +
        `${this.baseUrl}/api/v1/kyc-document-validation`,
      tracking.sessionId,
      tracking.trackingId,
      tracking.requestId,
    );

    // Headers with both formats for compatibility
    const headers = {
      'x-tracking-id': tracking.trackingId,
      'x-request-id': tracking.requestId,
      'x-session-id': tracking.sessionId,
      trackingid: tracking.trackingId,
      requestid: tracking.requestId,
      sessionid: tracking.sessionId,
    };

    return this.httpService
      .post<DocumentValidationResponseDto>(
        `${this.baseUrl}/api/v1/kyc-document-validation`,
        input,
        { headers },
      )
      .pipe(
        map((response) => {
          formatLogger(
            this.logger,
            'info',
            `Document validation process completed with status: ${response.data.statusValidation}`,
            tracking.sessionId,
            tracking.trackingId,
            tracking.requestId,
          );
          return response.data;
        }),
        catchError((error) => {
          formatLogger(
            this.logger,
            'error',
            `Error in document validation process: ${error.message}`,
            tracking.sessionId,
            tracking.trackingId,
            tracking.requestId,
          );

          const errorCode =
            error.response?.status === 400
              ? ErrorCodes.DOCUMENT_VALIDATION_DATA_INVALID
              : error.response?.status === 408
                ? ErrorCodes.DOCUMENT_VALIDATION_REQUEST_TIMEOUT
                : ErrorCodes.DOCUMENT_VALIDATION_SERVICE_ERROR;

          return throwError(() => ({
            code: errorCode,
            message: `Failed to validate document into msa-nb-cnb-orq url: ${this.baseUrl}/api/v1/kyc-document-validation: ${error.message}`,
            details: error.response?.data,
          }));
        }),
      );
  }

  notifyOnboardingFinish(
    input: NotifyOnboardingFinishInputDto,
    tracking: TrackingBaseDto,
  ): Observable<void> {
    formatLogger(
      this.logger,
      'info',
      `Sending onboarding finish notification for session ${tracking.sessionId}`,
      tracking.sessionId,
      tracking.trackingId,
      tracking.requestId,
    );

    return from(this.publishOnboardingFinish(input, tracking));
  }

  private async publishOnboardingFinish(
    input: NotifyOnboardingFinishInputDto,
    tracking: TrackingBaseDto,
  ): Promise<void> {
    try {
      await this.kafkaService.publishToQueue({
        topic: this.ONBOARDING_FINISH_TOPIC,
        headers: {
          source: 'leap-x/nb-gql',
          timestamp: new Date().toISOString(),
          trackingId: tracking.trackingId,
        },
        value: input,
      });

      formatLogger(
        this.logger,
        'info',
        `Successfully sent onboarding finish notification for session ${tracking.sessionId}`,
        tracking.sessionId,
        tracking.trackingId,
        tracking.requestId,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Failed to send onboarding finish notification: ${error.message}`,
        tracking.sessionId,
        tracking.trackingId,
        tracking.requestId,
      );
      throw error;
    }
  }

  startElectronicSignatureProcess(
    clientCnbDocumentId: string,
    tracking: TrackingBaseDto,
  ): Observable<ElectronicSignatureProcessResponseDto> {
    // Headers with both formats for compatibility
    const headers = {
      'x-tracking-id': tracking.trackingId,
      'x-request-id': tracking.requestId,
      'x-session-id': tracking.sessionId,
      trackingid: tracking.trackingId,
      requestid: tracking.requestId,
      sessionid: tracking.sessionId,
    };

    return this.httpService
      .post<ElectronicSignatureProcessResponseDto>(
        `${this.baseUrl}/api/v1/electronic-signature/${clientCnbDocumentId}/process`,
        {},
        { headers },
      )
      .pipe(
        map((response) => {
          return response.data;
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }
  private createHeaderFromTracking(tracking: TrackingBaseDto) {
    return {
      sessionId: tracking.sessionId,
      trackingId: tracking.trackingId,
      requestId: tracking.requestId,
    };
  }

  async createElectronicSign(
    data: IElectronicSignatureDataRequest,
    tracking: TrackingBaseDto,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    if (!data.identificationNumber) {
      throw new Error(
        'Identification number is required for create request  data in electronic signature in msa-nb-cnb-orq redis db',
      );
    }
    try {
      const endpoint = `${this.baseUrl}/api/v1/electronic-signature`;
      this.logger.log(
        `Creating electronic signature for ${data.identificationNumber}`,
      );

      const headers = this.createHeaderFromTracking(tracking);

      const response = await firstValueFrom(
        this.httpService.post<ISaveElectronicSignatureResponseRedis>(
          endpoint,
          data,
          {
            headers,
          },
        ),
      );

      this.logger.log(
        `Electronic signature created successfully for ${data.identificationNumber}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create electronic signature: ${
          error.response?.data || error.message
        }`,
      );
      throw error;
    }
  }

  async updateElectronicSign(
    data: IElectronicSignatureDataRequest,
    tracking: TrackingBaseDto,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    if (!data.identificationNumber) {
      ErrorHandler.handleError(
        'Error in update electronic signature into msa-nb-cnb-orq identification number is required',
        ErrorCodes.DOCUMENT_VALIDATION_CNB_ORQ_DOCUMENT_ERROR,
      );
    }
    try {
      const endpoint = `${this.baseUrl}/api/v1/electronic-signature/${data.identificationNumber}`;
      this.logger.log(
        `Updating electronic signature for ${data.identificationNumber}`,
      );

      const headers = this.createHeaderFromTracking(tracking);

      const response = await firstValueFrom(
        this.httpService.patch<ISaveElectronicSignatureResponseRedis>(
          endpoint,
          data,
          {
            headers,
          },
        ),
      );

      this.logger.log(
        `Electronic signature updated successfully for ${data.identificationNumber}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update electronic signature: ${
          error.response?.data || error.message
        }`,
      );
      throw error;
    }
  }

  saveCnbState(
    data: BlackListValidationRequest,
    tracking: TrackingBaseDto,
  ): Observable<BlackListValidationResponse> {
    const fullUrl = `${this.baseUrl}/api/v1/cnb/cnb-state-validation/save`;
    const headers = {
      trackingid: tracking.trackingId,
      requestid: tracking.requestId,
      sessionid: tracking.sessionId,
    };
    return this.httpService
      .post<BlackListValidationResponse>(fullUrl, data, { headers })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  getCnbState(
    identification: string,
    tracking: TrackingBaseDto,
  ): Observable<BlackListValidationRequest | BlackListValidationResponse> {
    const headers = {
      trackingid: tracking.trackingId,
      requestid: tracking.requestId,
      sessionid: tracking.sessionId,
    };
    const fullUrl = `${this.baseUrl}/api/v1/cnb/cnb-state-validation/${identification}`;
    return this.httpService
      .get<
        BlackListValidationRequest | BlackListValidationResponse
      >(fullUrl, { headers })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  generateDocument(
    document: GenerateDocumentDto,
  ): Observable<GenerateDocumentResponseDto> {
    return this.handleHttpRequestDocument<GenerateDocumentResponseDto>(
      'generate',
      document,
      'generate document',
    );
  }

  queryDocument(
    input: QueryDocumentInputDto,
  ): Observable<QueryDocumentResponseDto> {
    return this.handleHttpRequestDocument<QueryDocumentResponseDto>(
      'query',
      input,
      'query document',
    );
  }

  private handleHttpRequestDocument<T>(
    endpoint: string,
    payload: any,
    operation: string,
  ): Observable<T> {
    const fullUrl = `${this.baseUrl}/api/v1/documents/${endpoint}`;
    const traceId = uuidv4();

    const context = 'MsaCoDocumentService';
    const className = RestMsaNbCnbOrqService.name;
    const methodName = operation.replace(/ /g, '');
    const method = 'POST';

    HttpLoggerUtil.logRequest({
      context,
      className,
      methodName,
      url: fullUrl,
      method,
      payload,
      traceId,
    });

    return this.httpService.post<T>(fullUrl, payload).pipe(
      map((response: AxiosResponse<T>) => {
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
      retry(this.retry),
      timeout(this.timeout),
      catchError((error) => {
        this.logger.error(
          `${operation} failed in ${className}: ${error.message}`,
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
              `Failed to ${operation} in ${className}: ${error.message}`,
            ),
        );
      }),
    );
  }
}
