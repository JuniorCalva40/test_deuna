import { Inject, Injectable, Logger } from '@nestjs/common';
import { KycStatusDto } from '@src/application/dto/kyc-status.dto';
import {
  KycStoragePort,
  KYC_STORAGE_PORT,
} from '@src/application/ports/out/storage/kyc-storage.port';

/**
 * Case use for getting KYC validation results
 * Single responsibility: Retrieve validation results from Redis
 */
@Injectable()
export class GetValidationResultsUseCase {
  private readonly logger = new Logger(GetValidationResultsUseCase.name);

  constructor(
    @Inject(KYC_STORAGE_PORT)
    private readonly storagePort: KycStoragePort,
  ) {}

  /**
   * Gets KYC validation results for a specific scanId
   * @param scanId Unique identifier of the KYC process
   * @returns Validation results retrieved from Redis
   */
  async execute(scanId: string): Promise<KycStatusDto> {
    this.logger.log(`Getting validation results for scanId: ${scanId}`);
    try {
      const result = await this.storagePort.getValidationResultsRedis(scanId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting validation results: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
