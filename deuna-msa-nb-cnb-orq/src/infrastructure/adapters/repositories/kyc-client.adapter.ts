import { Injectable, Logger } from '@nestjs/common';
import {
  KycClientPort,
  ValidationResult,
} from '../../../application/ports/out/clients/kyc-client.port';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LivenessValidationDto } from '../../../application/dto/liveness-validation.dto';
import { FacialValidationDto } from '../../../application/dto/facial-validation.dto';
import { ValidationStatus } from '../../../domain/entities/validation-status.enum';

/**
 * Adapter for communication with the KYC microservice
 * Implements the KycClientPort defined in the application layer
 */
@Injectable()
export class KycClientAdapter implements KycClientPort {
  private readonly logger = new Logger(KycClientAdapter.name);
  private readonly kycServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.kycServiceUrl = this.configService.get<string>('MSA_TL_KYC_URL');
  }

  /**
   * Validates the life test (liveness) sending the data to the KYC microservice
   * @param data Data necessary for liveness validation
   * @param headers Additional headers to include in the request
   * @returns Validation result
   */
  async validateLiveness(
    data: LivenessValidationDto,
    headers?: Record<string, string>,
  ): Promise<ValidationResult> {
    try {
      this.logger.log(
        'Sending liveness validation request to KYC microservice',
      );

      // Verify that the service URL exists
      if (!this.kycServiceUrl) {
        throw new Error('KYC service URL not configured');
      }

      // Verify that the data contains the necessary information
      if (!data || !data.selfieImage) {
        throw new Error('Invalid or incomplete liveness data');
      }

      // Build HTTP headers
      const httpHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.kycServiceUrl}/api/v1/kyc/liveness-validation`,
          {
            imageBuffer: data.selfieImage,
            livenessData: data.livenessData,
          },
          {
            headers: httpHeaders,
          },
        ),
      );

      // Build standardized validation result
      return this.buildValidationResult(response.data);
    } catch (error) {
      this.logger.error('Error in liveness validation:', error);

      // Return standardized error result
      return {
        success: false,
        status: ValidationStatus.FAIL,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Valida la coincidencia facial enviando los datos al microservicio KYC
   * @param data Facial validation data necessary
   * @param headers Additional headers to include in the request
   * @returns Validation result
   */
  async validateFacialMatch(
    data: FacialValidationDto,
    headers?: Record<string, string>,
  ): Promise<ValidationResult> {
    try {
      this.logger.log('Sending facial validation request to KYC microservice');

      // Verificar que existe la URL del servicio
      if (!this.kycServiceUrl) {
        throw new Error('KYC service URL not configured');
      }

      // Verificar que los datos contienen la información necesaria
      if (!data || !data.documentImage || !data.selfieImage) {
        throw new Error('Invalid or incomplete facial validation data');
      }

      // Construir headers HTTP
      const httpHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.kycServiceUrl}/api/v1/kyc/facial-validation`,
          {
            token1: data.documentImage,
            token2: data.selfieImage,
            documentType: data.documentType,
          },
          {
            headers: httpHeaders,
          },
        ),
      );

      // Build standardized validation result
      return this.buildValidationResult(response.data);
    } catch (error) {
      this.logger.error('Error en validación facial:', error);

      // Return standardized error result
      return {
        success: false,
        status: ValidationStatus.FAIL,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Builds a ValidationResult object from the service response
   * @param responseData Service response
   * @returns Standardized validation result
   */
  private buildValidationResult(responseData: any): ValidationResult {
    // If the response already has the expected format, return it directly
    if (
      responseData?.success !== undefined &&
      responseData?.status !== undefined
    ) {
      return {
        success: responseData.success,
        status: responseData.status,
        error: responseData.error,
        score: responseData.score,
        timestamp: responseData.timestamp || new Date().toISOString(),
        details: responseData.details,
      };
    }

    // If not, build a standardized response from the received data
    return {
      success: responseData?.success || true,
      status: ValidationStatus.OK,
      timestamp: responseData?.timestamp || new Date().toISOString(),
      details: responseData,
    };
  }
}
