import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { ElectronicSignatureRequestDto } from '../../dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureStoragePort } from '../../ports/out/storage/electronic-signature-storage.port';
import { ELECTRONIC_SIGNATURE_STORAGE_PORT } from '../../../domain/constants/injection.constants';

/**
 * Use case for retrieving electronic signature requests from Redis
 * Single responsibility: Retrieve electronic signature requests from Redis
 */
@Injectable()
export class GetSignatureRequestUseCase {
  private readonly logger = new Logger({
    context: GetSignatureRequestUseCase.name,
  });

  constructor(
    @Inject(ELECTRONIC_SIGNATURE_STORAGE_PORT)
    private readonly storagePort: ElectronicSignatureStoragePort,
  ) {}

  /**
   * Retrieves an electronic signature request from Redis
   * @param identificationNumber - The identification number of the applicant
   * @returns The electronic signature request data or null if not found
   */
  async execute(
    identificationNumber: string,
  ): Promise<ElectronicSignatureRequestDto> {
    this.logger.log({
      message: 'Retrieving electronic signature request',
      identificationNumber,
    });

    try {
      // Get data from Redis with the specified key format
      const data =
        await this.storagePort.getSignatureRequest(identificationNumber);

      if (!data) {
        this.logger.warn({
          message: 'Electronic signature request not found',
          identificationNumber,
        });
        return null;
      }

      this.logger.log({
        message: 'Electronic signature request retrieved successfully',
        identificationNumber,
      });

      return data;
    } catch (error) {
      this.logger.error({
        message: 'Error retrieving electronic signature request',
        error: error.message,
        stack: error.stack,
        identificationNumber,
      });

      throw error;
    }
  }
}
