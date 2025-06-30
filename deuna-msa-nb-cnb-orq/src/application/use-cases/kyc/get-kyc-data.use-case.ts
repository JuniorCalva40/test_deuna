import { Inject, Injectable, Logger } from '@nestjs/common';
import { KycRequestDto } from '@src/application/dto/kyc-request.dto';
import {
  KycStoragePort,
  KYC_STORAGE_PORT,
} from '@src/application/ports/out/storage/kyc-storage.port';

/**
 * Case use for getting KYC data from storage
 * Single responsibility: Retrieve KYC data from Redis
 */
@Injectable()
export class GetKycDataUseCase {
  private readonly logger = new Logger(GetKycDataUseCase.name);

  constructor(
    @Inject(KYC_STORAGE_PORT)
    private readonly storagePort: KycStoragePort,
  ) {}

  /**
   * Gets KYC data for a specific scanId
   * @param scanId Unique identifier of the KYC process
   * @returns KYC data retrieved from Redis
   */
  async execute(scanId: string): Promise<KycRequestDto> {
    this.logger.log(`Getting KYC data for scanId: ${scanId}`);
    return this.storagePort.getKycData(scanId);
  }
}
