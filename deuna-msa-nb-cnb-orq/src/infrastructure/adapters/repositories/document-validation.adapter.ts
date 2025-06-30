import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map, catchError } from 'rxjs';
import { Logger } from '@deuna/tl-logger-nd';
import { DocumentValidationClientPort } from '../../../application/ports/out/clients/document-validation-client.port';
import { DocumentValidationStartDto } from '../../../application/dto/document-validation-start.dto';
import {
  DocumentValidationStartResponse,
  DocumentValidationStatusResponse,
  DocumentValidationDataResponse,
} from '../../../application/dto/document-validation-response.dto';
import { handleServiceError } from '../../../domain/utils/handle-service-error';
import { formatLogger } from '../../../domain/utils/format-logger';

@Injectable()
export class DocumentValidationAdapter implements DocumentValidationClientPort {
  private readonly logger = new Logger({
    context: DocumentValidationAdapter.name,
  });
  private readonly apiUrl: string;
  private readonly SERVICE_NAME = 'rest-msa-tl-kyc';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('MSA_TL_KYC_URL');
  }

  async startValidation(
    input:
      | Omit<DocumentValidationStartDto, 'onboardingSessionId'>
      | DocumentValidationStartDto,
  ): Promise<DocumentValidationStartResponse> {
    if (!this.apiUrl) {
      throw new Error('API URL rest-msa-tl-kyc is not configured');
    }
    const url = `${this.apiUrl}/api/v1/kyc/document-validation`;
    if (!input) {
      throw new Error('Input data is required');
    }

    const { trackingId, sessionId, requestId, ...data } = input;

    if (!trackingId || !sessionId || !requestId || !data.frontsideImage) {
      throw new Error('Required fields are missing');
    }

    formatLogger(
      this.logger,
      'info',
      `Adapter - Initiating document validation - Making request to ${url}`,
      sessionId,
      trackingId,
      requestId,
    );

    try {
      const response$ = this.httpService
        .post<DocumentValidationStartResponse>(url, data, {
          headers: {
            trackingId,
            sessionId,
            requestId,
          },
        })
        .pipe(
          map((response) => response.data),
          catchError((error) => {
            return handleServiceError(
              'startValidation',
              error,
              this.SERVICE_NAME,
              this.apiUrl,
              this.logger,
              { trackingId, sessionId, requestId },
            );
          }),
        );

      return await firstValueFrom(response$);
    } catch (error) {
      this.logger.error(
        `Error in startValidation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getValidationStatus(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationStatusResponse> {
    if (!this.apiUrl) {
      throw new Error('API URL rest-msa-tl-kyc is not configured');
    }

    const { trackingId, sessionId, requestId } = trackingData;
    const url = `${this.apiUrl}/api/v1/kyc/document-validation/status-check/${scanReference}`;
    formatLogger(
      this.logger,
      'info',
      `Adapter - Getting document validation status - Making request to ${url}`,
      sessionId,
      trackingId,
      requestId,
    );

    try {
      const response$ = this.httpService
        .get<DocumentValidationStatusResponse>(url, {
          headers: {
            trackingId,
            sessionId,
            requestId,
          },
        })
        .pipe(
          map((response) => response.data),
          catchError((error) => {
            return handleServiceError(
              'getValidationStatus',
              error,
              this.SERVICE_NAME,
              this.apiUrl,
              this.logger,
              trackingData,
            );
          }),
        );

      return await firstValueFrom(response$);
    } catch (error) {
      this.logger.error(
        `Error in getValidationStatus: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getValidationData(
    scanReference: string,
    trackingData: { trackingId: string; sessionId: string; requestId: string },
  ): Promise<DocumentValidationDataResponse> {
    if (!this.apiUrl) {
      throw new Error('API URL rest-msa-tl-kyc is not configured');
    }

    const { trackingId, sessionId, requestId } = trackingData;
    const url = `${this.apiUrl}/api/v1/kyc/document-validation/data-check/${scanReference}`;

    formatLogger(
      this.logger,
      'info',
      `Adapter - Getting document validation data - Making request to ${url}`,
      sessionId,
      trackingId,
      requestId,
    );

    try {
      const response$ = this.httpService
        .get<DocumentValidationDataResponse>(url, {
          headers: {
            trackingId,
            sessionId,
            requestId,
          },
        })
        .pipe(
          map((response) => response.data),
          catchError((error) => {
            return handleServiceError(
              'getValidationData',
              error,
              this.SERVICE_NAME,
              this.apiUrl,
              this.logger,
              trackingData,
            );
          }),
        );

      return await firstValueFrom(response$);
    } catch (error) {
      this.logger.error(
        `Error in getValidationData: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
