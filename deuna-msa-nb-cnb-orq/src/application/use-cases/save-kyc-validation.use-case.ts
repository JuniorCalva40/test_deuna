import { Inject, Injectable } from '@nestjs/common';
import { FacialValidationDto } from '../dto/facial-validation.dto';
import { LivenessValidationDto } from '../dto/liveness-validation.dto';
import { KYC_STORAGE_PORT } from '../ports/out/storage/kyc-storage.port';
import { KycStoragePort } from '../ports/out/storage/kyc-storage.port';
import { TrackingInfoDto } from '../../infrastructure/constants/common';
/**
 * Use case for saving KYC validation results in storage
 */
@Injectable()
export class SaveKycValidationUseCase {
  constructor(
    @Inject(KYC_STORAGE_PORT) private readonly kycStorage: KycStoragePort,
  ) {}

  async execute(
    scanId: string,
    data: {
      facialValidation: FacialValidationDto;
      livenessValidation: LivenessValidationDto;
      trackingInfo: TrackingInfoDto;
      onboardingSessionId: string;
    },
  ): Promise<void> {
    await this.kycStorage.saveKycRequestRedis(scanId, data);
  }
}
