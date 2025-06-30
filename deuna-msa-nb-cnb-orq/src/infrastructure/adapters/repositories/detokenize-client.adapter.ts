import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map, catchError } from 'rxjs';
import { Logger } from '@deuna/tl-logger-nd';
import { AxiosError } from 'axios';
import { DetokenizeClientPort } from '../../../application/ports/out/clients/detokenize-client.port';
import { DetokenizeRequestDto } from '../../../application/dto/detokenize/detokenize-request.dto';
import { DetokenizeResponseDto } from '../../../application/dto/detokenize/detokenize-response.dto';
import { formatLogger } from '../../../domain/utils/format-logger';
import {
  ConnectionRefusedError,
  ConnectionTimeoutError,
  DnsResolutionError,
  HttpResponseError,
  NoResponseError,
  CommunicationError,
} from '../../../application/errors/external-service-error';

/**
 * Adapter implementation for detokenize client
 * Responsible for communicating with the KYC service to detokenize images
 */
@Injectable()
export class DetokenizeClientAdapter implements DetokenizeClientPort {
  private readonly logger = new Logger({
    context: DetokenizeClientAdapter.name,
  });
  private readonly apiUrl: string;
  private readonly SERVICE_NAME = 'rest-msa-tl-kyc';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('MSA_TL_KYC_URL');
    if (!this.apiUrl) {
      throw new Error(
        'API URL for KYC service (MSA_TL_KYC_URL) is not configured',
      );
    }
  }

  /**
   * Detokenizes an image token by calling the KYC service
   * @param request - The request containing the token to detokenize
   * @param trackingData - The tracking data for the request
   * @returns A promise with the detokenized image data
   */
  async detokenizeImage(
    request: DetokenizeRequestDto,
    trackingData: { sessionId: string; trackingId: string; requestId: string },
  ): Promise<DetokenizeResponseDto> {
    const { sessionId, trackingId, requestId } = trackingData;
    const url = `${this.apiUrl}/api/v1/kyc/images/detokenize`;

    formatLogger(
      this.logger,
      'info',
      `Adapter - Detokenizing image - Making request to ${url}`,
      sessionId,
      trackingId,
      requestId,
    );

    try {
      const response$ = this.httpService
        .post<any>(url, request, {
          headers: {
            sessionId,
            trackingId,
            requestId,
            'Content-Type': 'application/json',
          },
        })
        .pipe(
          map((response) => {
            const responseDto = new DetokenizeResponseDto();

            // the service returns the imageBuffer field in the successful response
            if (response.data && response.data.imageBuffer) {
              responseDto.imageData = response.data.imageBuffer;
              responseDto.status = 'SUCCESS';
              responseDto.message = 'Image detokenized successfully';

              formatLogger(
                this.logger,
                'info',
                'Successfully received detokenized image from service',
                sessionId,
                trackingId,
                requestId,
              );
            } else {
              responseDto.status = 'ERROR';
              responseDto.message =
                'Failed to detokenize image: Invalid response format - imageBuffer not found';

              formatLogger(
                this.logger,
                'info',
                `Response did not contain expected imageBuffer field - responseData: ${JSON.stringify(response.data)}`,
                sessionId,
                trackingId,
                requestId,
              );
            }

            return responseDto;
          }),
          catchError((error: AxiosError) => {
            formatLogger(
              this.logger,
              'error',
              `Error detokenizing image: ${error.message}`,
              sessionId,
              trackingId,
              requestId,
            );

            const errorResponse = new DetokenizeResponseDto();
            errorResponse.status = 'ERROR';

            // We classify the error according to its type for a more specific handling
            if (error.code === 'ECONNREFUSED') {
              throw new ConnectionRefusedError(
                'Connection refused when calling detokenize service',
                { originalError: error.message },
                url,
              );
            } else if (
              error.code === 'ETIMEDOUT' ||
              error.code === 'ECONNABORTED'
            ) {
              throw new ConnectionTimeoutError(
                'Connection timeout when calling detokenize service',
                { originalError: error.message },
                url,
              );
            } else if (
              error.code === 'EAI_AGAIN' ||
              error.code === 'ENOTFOUND'
            ) {
              throw new DnsResolutionError(
                'DNS resolution error when calling detokenize service',
                { originalError: error.message },
                url,
              );
            } else if (error.response) {
              // HTTP error
              throw new HttpResponseError(
                `HTTP error ${error.response.status} when calling detokenize service: ${error.response.statusText}`,
                error.response.status,
                {
                  responseData: error.response.data,
                  originalError: error.message,
                },
                url,
              );
            } else if (error.request) {
              // The request was made but no response was received
              throw new NoResponseError(
                'No response received from detokenize service',
                { originalError: error.message },
                url,
              );
            } else {
              // Error in the request configuration
              throw new CommunicationError(
                `Error communicating with detokenize service: ${error.message}`,
                { originalError: error.message },
                url,
              );
            }
          }),
        );

      return await firstValueFrom(response$);
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error detokenizing image: ${error.message} - endpoint: ${url}`,
        sessionId,
        trackingId,
        requestId,
      );

      const errorResponse = new DetokenizeResponseDto();
      errorResponse.status = 'ERROR';

      // We preserve the original error message if it is one of our custom errors
      if (
        error instanceof HttpResponseError ||
        error instanceof ConnectionRefusedError ||
        error instanceof ConnectionTimeoutError ||
        error instanceof DnsResolutionError ||
        error instanceof NoResponseError ||
        error instanceof CommunicationError
      ) {
        errorResponse.message = error.message;
      } else {
        errorResponse.message = `Failed to detokenize image: ${error.message}`;
      }

      return errorResponse;
    }
  }
}
