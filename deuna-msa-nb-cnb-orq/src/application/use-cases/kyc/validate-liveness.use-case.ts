import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  KycClientPort,
  KYC_CLIENT_PORT,
  ValidationResult,
} from '@src/application/ports/out/clients/kyc-client.port';
import { TrackingInfoDto } from '@src/infrastructure/constants/common';
import { LivenessValidationDto } from '@src/application/dto/liveness-validation.dto';

/**
 * Use case for liveness validation
 * Single responsibility: Execute liveness proof validation
 * through the KYC microservice
 */
@Injectable()
export class ValidateLivenessUseCase {
  private readonly logger = new Logger(ValidateLivenessUseCase.name);

  constructor(
    @Inject(KYC_CLIENT_PORT)
    private readonly kycClient: KycClientPort,
  ) {}

  /**
   * Executes liveness validation through the KYC microservice
   * @param livenessData Liveness data required for validation
   * @param trackingInfo Tracking information for operation monitoring
   * @returns Validation result
   */
  async execute(
    livenessData: any,
    trackingInfo?: TrackingInfoDto,
  ): Promise<ValidationResult> {
    this.logger.log('Executing liveness validation');

    // Verify that the data contains the necessary information - compatible with both formats
    const hasNewFormat = livenessData.selfieImage;
    const hasOldFormat = livenessData.imageBuffer;

    if (!hasNewFormat && !hasOldFormat) {
      throw new Error('Liveness data does not contain the required image');
    }

    // Adapt data to the format expected by the service
    const adaptedData: LivenessValidationDto = {
      selfieImage: livenessData.selfieImage || livenessData.imageBuffer,
      livenessData: livenessData.livenessData || {},
    };

    // Convert TrackingInfoDto to headers for the HTTP client
    const headers: Record<string, string> = {};

    if (trackingInfo) {
      if (trackingInfo.sessionId) headers['sessionId'] = trackingInfo.sessionId;
      if (trackingInfo.trackingId)
        headers['trackingId'] = trackingInfo.trackingId;
      if (trackingInfo.requestId) headers['requestId'] = trackingInfo.requestId;
    }

    return this.kycClient.validateLiveness(adaptedData, headers);
  }
}
