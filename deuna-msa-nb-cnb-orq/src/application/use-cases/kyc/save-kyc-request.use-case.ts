import { Inject, Injectable, Logger } from '@nestjs/common';
import { FacialValidationDto } from '@src/application/dto/facial-validation.dto';
import { LivenessValidationDto } from '@src/application/dto/liveness-validation.dto';
import {
  KycStoragePort,
  KYC_STORAGE_PORT,
} from '@src/application/ports/out/storage/kyc-storage.port';

/**
 * Case use for saving KYC requests
 * Single responsibility: Store KYC requests in Redis
 */
@Injectable()
export class SaveKycRequestUseCase {
  private readonly logger = new Logger(SaveKycRequestUseCase.name);

  constructor(
    @Inject(KYC_STORAGE_PORT)
    private readonly storagePort: KycStoragePort,
  ) {}

  /**
   * Saves a KYC request
   * @param scanId Unique identifier of the KYC process
   * @param data KYC request data (facial validation and liveness)
   */
  async execute(
    scanId: string,
    data: {
      facialValidation: FacialValidationDto;
      livenessValidation: LivenessValidationDto;
    },
  ): Promise<void> {
    this.logger.log(`Saving KYC request for scanId: ${scanId}`);

    try {
      await this.storagePort.saveKycRequestRedis(scanId, data);
    } catch (error) {
      this.logger.error(`Error saving KYC request: ${error.message}`, error);
      throw error;
    }
  }
}
