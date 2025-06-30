import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@deuna/tl-cache-nd';
import { ElectronicSignatureStoragePort } from '../../../application/ports/out/storage/electronic-signature-storage.port';
import { ElectronicSignatureRequestDto } from '../../../application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureUpdateDto } from '../../../application/dto/electronic-signature/electronic-signature-update.dto';

@Injectable()
export class RedisElectronicSignatureStorageAdapter
  implements ElectronicSignatureStoragePort
{
  private readonly logger = new Logger(
    RedisElectronicSignatureStorageAdapter.name,
  );

  constructor(private readonly redisService: RedisService) {}

  async saveSignatureRequest(
    identificationNumber: string,
    data: ElectronicSignatureRequestDto,
  ): Promise<void> {
    try {
      const key = `request:sign:billing:${identificationNumber}`;
      await this.redisService.set(key, JSON.stringify(data));
      this.logger.log(`Signature request saved successfully with key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Error saving signature request for identification ${identificationNumber}:`,
        error,
      );
      throw new Error(`Error saving signature request: ${error.message}`);
    }
  }

  async getSignatureRequest(
    identificationNumber: string,
  ): Promise<ElectronicSignatureRequestDto> {
    try {
      const key = `request:sign:billing:${identificationNumber}`;
      const data = await this.redisService.get(key);

      if (!data) {
        this.logger.warn(
          `Signature request not found for identification: ${identificationNumber}`,
        );
        return null;
      }

      if (typeof data === 'object' && data !== null) {
        return data as ElectronicSignatureRequestDto;
      }

      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (error) {
          this.logger.error(
            `Error parsing signature request data from Redis for identification ${identificationNumber}:`,
            error,
          );
          throw new Error(
            `Error parsing signature request data: ${error.message}`,
          );
        }
      }

      this.logger.warn(
        `Unexpected data type for identification ${identificationNumber}: ${typeof data}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error getting signature request data for identification ${identificationNumber}:`,
        error,
      );
      throw error;
    }
  }

  async updateSignatureRequest(
    identificationNumber: string,
    updateData: ElectronicSignatureUpdateDto,
  ): Promise<void> {
    try {
      const key = `request:sign:billing:${identificationNumber}`;

      // Get the current data
      const currentData = await this.getSignatureRequest(identificationNumber);

      if (!currentData) {
        this.logger.error(
          `No data found in redis db to update for identification: ${identificationNumber}`,
        );
        throw new Error(
          `No data found in redis db to update for identification: ${identificationNumber}`,
        );
      }

      // Combine the current data with the update
      const updatedData = {
        ...currentData,
        ...updateData,
      };

      // Save the updated data
      await this.redisService.set(key, JSON.stringify(updatedData));

      this.logger.log(
        `Signature request updated successfully with key: ${key}`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating signature request for identification ${identificationNumber}:`,
        error,
      );
      throw new Error(`Error updating signature request: ${error.message}`);
    }
  }
}
