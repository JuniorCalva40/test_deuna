import { Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { ElectronicSignatureRequestDto } from '../dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureResponseDto } from '../dto/electronic-signature/electronic-signature-redis-response.dto';
import { ElectronicSignatureUpdateDto } from '../dto/electronic-signature/electronic-signature-update.dto';
import { ElectronicSignatureUpdateResponseDto } from '../dto/electronic-signature/electronic-signature-update-redis-response.dto';
import { ElectronicSignatureGetResponseDto } from '../dto/electronic-signature/electronic-signature-get-response.dto';
import { ElectronicSignatureProcessResponseDto } from '../dto/electronic-signature/electronic-signature-process-response.dto';
import { ElectronicSignatureServicePort } from '../ports/in/services/electronic-signature.service.port';
import { validateTrackingHeadersApi } from '../../domain/utils/validator-tracking-headers-api';
import { SaveSignatureRequestUseCase } from '../use-cases/electronic-signature/save-signature-request.use-case';
import { UpdateSignatureRequestUseCase } from '../use-cases/electronic-signature/update-signature-request.use-case';
import { GetSignatureRequestUseCase } from '../use-cases/electronic-signature/get-signature-request.use-case';
import { ProcessDigitalSignatureUseCase } from '../use-cases/electronic-signature/process-digital-signature.use-case';
import { IElectronicSignatureData } from '../../domain/interfaces/electronic-signature-data.interface';
import { validateElectronicSignatureData } from '../../domain/utils/electronic-signature-validator';
import { DetokenizeImageUseCase } from '../use-cases/detokenize/detokenize-image.use-case';

@Injectable()
export class ElectronicSignatureService
  implements ElectronicSignatureServicePort
{
  private readonly logger = new Logger({
    context: ElectronicSignatureService.name,
  });

  constructor(
    private readonly saveSignatureRequestUseCase: SaveSignatureRequestUseCase,
    private readonly updateSignatureRequestUseCase: UpdateSignatureRequestUseCase,
    private readonly getSignatureRequestUseCase: GetSignatureRequestUseCase,
    private readonly processDigitalSignatureUseCase: ProcessDigitalSignatureUseCase,
    private readonly detokenizeImageUseCase: DetokenizeImageUseCase,
  ) {}

  async saveSignatureRequest(
    request: ElectronicSignatureRequestDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureResponseDto> {
    try {
      this.logger.log({
        message: 'Processing electronic signature request in redis-db',
        identificationNumber: request.identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      // Use the use case to save data in Redis
      await this.saveSignatureRequestUseCase.execute(
        request.identificationNumber,
        request,
      );

      // Generate response
      const response: ElectronicSignatureResponseDto = {
        status: 'SAVED',
        message: 'Electronic signature request saved successfully in redis-db',
      };

      this.logger.log({
        message: 'Electronic signature request processed successfully',
        identificationNumber: request.identificationNumber,
        requestId,
        sessionId,
        trackingId,
      });

      return response;
    } catch (error) {
      this.logger.error({
        message: 'Error processing electronic signature request in redis-db',
        error: error.message,
        stack: error.stack,
        identificationNumber: request.identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      throw error;
    }
  }

  async updateSignatureRequest(
    identificationNumber: string,
    updateData: ElectronicSignatureUpdateDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureUpdateResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting Electronic Signature Update - Service',
      sessionId,
      trackingId,
      requestId,
    );

    try {
      this.logger.log({
        message: 'Processing electronic signature update request',
        identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      // Use the use case to update data in Redis
      await this.updateSignatureRequestUseCase.execute(
        identificationNumber,
        updateData,
      );

      // Generate response
      const response: ElectronicSignatureUpdateResponseDto = {
        status: 'UPDATED',
        message:
          'Electronic signature request updated successfully in redis-db',
      };

      this.logger.log({
        message:
          'Electronic signature request updated successfully in redis-db',
        identificationNumber,
        sessionId,
        trackingId,
      });

      return response;
    } catch (error) {
      this.logger.error({
        message: 'Error updating electronic signature request in redis-db',
        error: error.message,
        stack: error.stack,
        identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      throw error;
    }
  }

  async getSignatureRequest(
    identificationNumber: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureGetResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting Electronic Signature Get Request - Service',
      sessionId,
      trackingId,
      requestId,
    );

    try {
      this.logger.log({
        message: 'Retrieving electronic signature request',
        identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      // Use the use case to get data from Redis
      const data =
        await this.getSignatureRequestUseCase.execute(identificationNumber);

      // Generate response
      const response: ElectronicSignatureGetResponseDto = {
        status: data ? 'SUCCESS' : 'NOT_FOUND',
        message: data
          ? 'Electronic signature request retrieved successfully'
          : 'Electronic signature request not found',
        data: data || null,
      };

      this.logger.log({
        message:
          response.status === 'SUCCESS'
            ? 'Electronic signature request retrieved successfully'
            : 'Electronic signature request not found',
        identificationNumber,
        sessionId,
        trackingId,
      });

      return response;
    } catch (error) {
      this.logger.error({
        message: 'Error retrieving electronic signature request',
        error: error.message,
        stack: error.stack,
        identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      const response: ElectronicSignatureGetResponseDto = {
        status: 'ERROR',
        message: `Error retrieving electronic signature request: ${error.message}`,
        data: null,
      };

      return response;
    }
  }

  async processDigitalSignature(
    identificationNumber: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureProcessResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting Digital Signature Processing - Service',
      sessionId,
      trackingId,
      requestId,
    );

    try {
      this.logger.log({
        message: 'Starting digital signature processing',
        identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      // First, retrieve the data stored in Redis
      const dataRedis: IElectronicSignatureData =
        await this.getSignatureRequestUseCase.execute(identificationNumber);

      // If no data is found, return the appropriate response
      if (!dataRedis) {
        this.logger.warn({
          message: 'Data not found in redis-db',
          identificationNumber,
          sessionId,
          trackingId,
          requestId,
        });

        return {
          status: 'NOT_FOUND',
          message: 'No data found for request digital signature processing',
        };
      }

      // Validate that the data in Redis contains all the required fields
      try {
        validateElectronicSignatureData(dataRedis);
      } catch (error) {
        this.logger.error({
          message:
            'Invalid data format for request digital signature processing',
          error: error.message,
          identificationNumber,
          sessionId,
          trackingId,
          requestId,
        });

        return {
          status: 'FAILED',
          message: `Error processing digital signature: ${error.message}`,
        };
      }

      // Detokenize the fileIdentificationSelfie
      const detokenizedFileIdentificationSelfie =
        await this.detokenizeFileIdentificationSelfie(
          dataRedis.fileIdentificationSelfie,
          sessionId,
          trackingId,
          requestId,
        );

      if (!detokenizedFileIdentificationSelfie) {
        this.logger.error({
          message: 'Failed to detokenize fileIdentificationSelfie',
          identificationNumber,
          sessionId,
          trackingId,
          requestId,
        });

        return {
          status: 'FAILED',
          message:
            'Error processing digital signature: Failed to detokenize image',
        };
      }

      // Update the data with the detokenized image
      const updatedData = {
        ...dataRedis,
        fileIdentificationSelfie: detokenizedFileIdentificationSelfie,
      };

      // Process the digital signature using the use case
      const resultProccessSign =
        await this.processDigitalSignatureUseCase.execute(
          updatedData,
          sessionId,
          trackingId,
          requestId,
        );

      return resultProccessSign;
    } catch (error) {
      this.logger.error({
        message: 'Error processing digital signature',
        error: error.message,
        stack: error.stack,
        identificationNumber,
        sessionId,
        trackingId,
        requestId,
      });

      return {
        status: 'FAILED',
        message: `Error processing digital signature: ${error.message}`,
      };
    }
  }

  /**
   * Detokenizes the fileIdentificationSelfie token
   * @param token - The token to detokenize
   * @param sessionId - Session ID for tracking
   * @param trackingId - Tracking ID for request tracing
   * @param requestId - Request ID for tracing
   * @returns The detokenized image data or null if failed
   */
  private async detokenizeFileIdentificationSelfie(
    token: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<string | null> {
    try {
      this.logger.log({
        message: 'Detokenizing fileIdentificationSelfie',
        sessionId,
        trackingId,
        requestId,
      });

      const detokenizeResponse = await this.detokenizeImageUseCase.execute(
        token,
        { sessionId, trackingId, requestId },
      );

      if (
        detokenizeResponse.status === 'SUCCESS' &&
        detokenizeResponse.imageData
      ) {
        this.logger.log({
          message: 'Successfully detokenized fileIdentificationSelfie',
          sessionId,
          trackingId,
          requestId,
        });
        return detokenizeResponse.imageData;
      } else {
        this.logger.error({
          message: `Failed to detokenize fileIdentificationSelfie: ${detokenizeResponse.message}`,
          sessionId,
          trackingId,
          requestId,
        });
        return null;
      }
    } catch (error) {
      this.logger.error({
        message: 'Error detokenizing fileIdentificationSelfie',
        error: error.message,
        stack: error.stack,
        sessionId,
        trackingId,
        requestId,
      });
      return null;
    }
  }
}
