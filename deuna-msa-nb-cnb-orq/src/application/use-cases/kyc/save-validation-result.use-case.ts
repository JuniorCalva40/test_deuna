import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  KycStoragePort,
  KYC_STORAGE_PORT,
} from '@src/application/ports/out/storage/kyc-storage.port';

/**
 * Use case for saving KYC validation results
 * Single responsibility: Store validation results in Redis
 */
@Injectable()
export class SaveValidationResultUseCase {
  private readonly logger = new Logger(SaveValidationResultUseCase.name);

  constructor(
    @Inject(KYC_STORAGE_PORT)
    private readonly storagePort: KycStoragePort,
  ) {}

  /**
   * Saves the result of a KYC validation
   * @param scanId Unique identifier of the KYC process
   * @param type Type of validation ('liveness' or 'facial')
   * @param result Validation result
   */
  async execute(
    scanId: string,
    type: 'liveness' | 'facial',
    result: any,
  ): Promise<void> {
    this.logger.log(`Saving ${type} validation result for scanId: ${scanId}`);

    try {
      await this.storagePort.saveValidationResultRedis(scanId, type, result);
    } catch (error) {
      this.logger.error(
        `Error saving ${type} validation result: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
