import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  KycClientPort,
  KYC_CLIENT_PORT,
  ValidationResult,
} from '@src/application/ports/out/clients/kyc-client.port';
import { TrackingInfoDto } from '@src/infrastructure/constants/common';
import { FacialValidationDto } from '@src/application/dto/facial-validation.dto';

/**
 * Use case for facial matching validation
 * Single responsibility: Execute facial matching validation
 * through the KYC microservice
 */
@Injectable()
export class ValidateFacialMatchUseCase {
  private readonly logger = new Logger(ValidateFacialMatchUseCase.name);

  constructor(
    @Inject(KYC_CLIENT_PORT)
    private readonly kycClient: KycClientPort,
  ) {}

  /**
   * Executes facial matching validation through the KYC microservice
   * @param facialData Required facial validation data
   * @param trackingInfo Tracking information for operation monitoring
   * @returns Validation result
   */
  async execute(
    facialData: any,
    trackingInfo?: TrackingInfoDto,
  ): Promise<ValidationResult> {
    this.logger.log('Executing facial matching validation');

    // Verify that the data contains the necessary information - compatible with both formats
    const hasNewFormat = facialData.documentImage && facialData.selfieImage;
    const hasOldFormat = facialData.token1 && facialData.token2;

    if (!hasNewFormat && !hasOldFormat) {
      throw new Error('Facial validation data is incomplete');
    }

    // Adapt data to the format expected by the service
    const adaptedData: FacialValidationDto = {
      documentImage: facialData.documentImage || facialData.token1,
      selfieImage: facialData.selfieImage || facialData.token2,
      documentType: facialData.documentType || 'DNI',
    };

    // Convert TrackingInfoDto to headers for the HTTP client
    const headers: Record<string, string> = {};

    if (trackingInfo) {
      if (trackingInfo.sessionId) headers['sessionId'] = trackingInfo.sessionId;
      if (trackingInfo.trackingId)
        headers['trackingId'] = trackingInfo.trackingId;
      if (trackingInfo.requestId) headers['requestId'] = trackingInfo.requestId;
    }

    return this.kycClient.validateFacialMatch(adaptedData, headers);
  }
}
