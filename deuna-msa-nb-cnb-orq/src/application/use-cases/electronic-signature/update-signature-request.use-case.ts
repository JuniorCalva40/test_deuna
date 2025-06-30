import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { ElectronicSignatureUpdateDto } from '@src/application/dto/electronic-signature/electronic-signature-update.dto';
import { ElectronicSignatureStoragePort } from '@src/application/ports/out/storage/electronic-signature-storage.port';
import { ELECTRONIC_SIGNATURE_STORAGE_PORT } from '@src/domain/constants/injection.constants';

/**
 * Use case for updating electronic signature requests in Redis
 * Single responsibility: Update electronic signature requests in Redis
 */
@Injectable()
export class UpdateSignatureRequestUseCase {
  private readonly logger = new Logger({
    context: UpdateSignatureRequestUseCase.name,
  });

  constructor(
    @Inject(ELECTRONIC_SIGNATURE_STORAGE_PORT)
    private readonly storagePort: ElectronicSignatureStoragePort,
  ) {}

  /**
   * Updates an electronic signature request in Redis
   * @param identificationNumber - The identification number of the applicant
   * @param data - The electronic signature update data
   */
  async execute(
    identificationNumber: string,
    data: ElectronicSignatureUpdateDto,
  ): Promise<void> {
    this.logger.log({
      message: 'Updating electronic signature request',
      identificationNumber,
    });

    try {
      // Update data in Redis with the specified key format
      await this.storagePort.updateSignatureRequest(identificationNumber, data);

      this.logger.log({
        message: 'Electronic signature request updated successfully',
        identificationNumber,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error updating electronic signature request',
        error: error.message,
        stack: error.stack,
        identificationNumber,
      });

      throw error;
    }
  }
}
