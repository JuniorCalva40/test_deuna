import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { ElectronicSignatureRequestDto } from '@src/application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureStoragePort } from '@src/application/ports/out/storage/electronic-signature-storage.port';
import { ELECTRONIC_SIGNATURE_STORAGE_PORT } from '@src/domain/constants/injection.constants';

/**
 * Use case for saving electronic signature requests in Redis
 * Single responsibility: Store electronic signature requests in Redis
 */
@Injectable()
export class SaveSignatureRequestUseCase {
  private readonly logger = new Logger({
    context: SaveSignatureRequestUseCase.name,
  });

  constructor(
    @Inject(ELECTRONIC_SIGNATURE_STORAGE_PORT)
    private readonly storagePort: ElectronicSignatureStoragePort,
  ) {}

  /**
   * Saves an electronic signature request in Redis
   * @param identificationNumber - The identification number of the applicant
   * @param data - The electronic signature request data
   */
  async execute(
    identificationNumber: string,
    data: ElectronicSignatureRequestDto,
  ): Promise<void> {
    this.logger.log({
      message: 'Saving electronic signature request',
      identificationNumber,
    });

    try {
      // Save data in Redis with the specified key format
      await this.storagePort.saveSignatureRequest(identificationNumber, data);

      this.logger.log({
        message: 'Electronic signature request saved successfully',
        identificationNumber,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error saving electronic signature request',
        error: error.message,
        stack: error.stack,
        identificationNumber,
      });

      throw error;
    }
  }
}
