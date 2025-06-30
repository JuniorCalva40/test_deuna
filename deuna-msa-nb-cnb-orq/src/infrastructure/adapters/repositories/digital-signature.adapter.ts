import { Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { DigitalSignatureRepositoryPort } from '../../../application/ports/out/repository/digital-signature-repository.port';
import { ElectronicSignatureRequestDto } from '../../../application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { formatLogger } from '../../../domain/utils/format-logger';
import {
  DigitalSignatureResponse,
  DigitalSignatureSuccessResponse,
  DigitalSignatureErrorResponse,
} from '../../../application/dto/electronic-signature/electronic-signature-external-service-response.dto';
import {
  ConnectionRefusedError,
  DnsResolutionError,
  CommunicationError,
} from '../../../application/errors/external-service-error';
import { ElectronicSignatureProcessResponseDto } from '../../../application/dto/electronic-signature/electronic-signature-process-response.dto';

@Injectable()
export class DigitalSignatureAdapter implements DigitalSignatureRepositoryPort {
  private readonly logger = new Logger({
    context: DigitalSignatureAdapter.name,
  });

  private readonly apiUrl: string;
  private readonly endpoint: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('MSA_TL_DIGISIGN_INVOICE_URL');
    if (!this.apiUrl) {
      throw new Error('MSA_TL_DIGISIGN_INVOICE_URL is not configured');
    }
    this.endpoint = `${this.apiUrl}/api/v1/digital-signatures`;
  }

  async processDigitalSignature(
    data: ElectronicSignatureRequestDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureProcessResponseDto> {
    try {
      formatLogger(
        this.logger,
        'info',
        `Sending request to the digital signature service - identificationNumber: ${data.identificationNumber} - url: ${this.endpoint}`,
        sessionId,
        trackingId,
        requestId,
      );

      // config the http request
      const response = await firstValueFrom(
        this.httpService.post<DigitalSignatureResponse>(this.endpoint, data, {
          headers: {
            'Content-Type': 'application/json',
            sessionId,
            trackingId,
            requestId,
          },
        }),
      );

      const responseData = response.data;

      // Verify if the response contains an error object
      if (responseData.status === 'error') {
        const errorData = responseData as DigitalSignatureErrorResponse;

        // error response status 200
        formatLogger(
          this.logger,
          'error',
          `Error in the response of the digital signature service - url: ${this.endpoint} - message: ${errorData.message} - identificationNumber: ${data.identificationNumber}`,
          sessionId,
          trackingId,
          requestId,
        );

        return {
          status: 'FAILED',
          message: 'Error in the response of the digital signature service',
        };
      }

      if (responseData.status === 'success') {
        const successData = responseData as DigitalSignatureSuccessResponse;

        const referenceTransaction =
          successData.referenceTransaction ||
          successData.data?.referenceTransaction;

        formatLogger(
          this.logger,
          'info',
          `Digital signature processed successfully - identificationNumber: ${data.identificationNumber} - referenceTransaction: ${referenceTransaction}`,
          sessionId,
          trackingId,
          requestId,
        );

        return {
          status: 'PROCESSED',
          message: 'Digital signature processed successfully',
          referenceTransaction: referenceTransaction,
        };
      }
    } catch (error) {
      // Identify specifically connection errors or service not available
      if (error instanceof AxiosError) {
        const details = {
          identificationNumber: data.identificationNumber,
          sessionId,
          trackingId,
          requestId,
          originalError: error.message,
        };

        if (error.code === 'ECONNREFUSED') {
          const message =
            'Could not connect to the digital signature service. The service is not available.';
          formatLogger(
            this.logger,
            'error',
            `${message} - url: ${this.endpoint} - error: ${error.message} - code: ${error.code} - identificationNumber: ${data.identificationNumber}`,
            sessionId,
            trackingId,
            requestId,
          );

          throw new ConnectionRefusedError(message, details, this.endpoint);
        }

        if (error.code === 'ENOTFOUND') {
          const message =
            'No could resolve the host name for the digital signature service. The URL is incorrect or the service is not available.';
          formatLogger(
            this.logger,
            'error',
            `${message} - url: ${this.endpoint} - error: ${error.message} - code: ${error.code} - identificationNumber: ${data.identificationNumber}`,
            sessionId,
            trackingId,
            requestId,
          );

          throw new DnsResolutionError(message, details, this.endpoint);
        }
      }

      // Generic error if not specifically identified
      const message =
        'Error when communicating with the digital signature service';
      const details = {
        identificationNumber: data.identificationNumber,
        sessionId,
        trackingId,
        requestId,
        originalError: error.message,
        stack: error.stack,
      };

      formatLogger(
        this.logger,
        'error',
        `${message} - url: ${this.endpoint} - error: ${error.message} - identificationNumber: ${data.identificationNumber}`,
        sessionId,
        trackingId,
        requestId,
      );

      throw new CommunicationError(message, details, this.endpoint);
    }
  }
}
