import { RedisService } from '@deuna/tl-cache-nd';
import { Injectable, Logger } from '@nestjs/common';
import { CnbStateValidationDTO } from '../../../application/dto/cnb-state-validation-request.dto';
import { CnbStateValidationStoragePort as CnbStateValidationStoragePort } from '../../../application/ports/out/storage/cnb-state-validation-storage.port';

@Injectable()
export class RedisCnbStateValidationAdapter
  implements CnbStateValidationStoragePort
{
  private readonly logger = new Logger(RedisCnbStateValidationAdapter.name);

  constructor(private readonly redisService: RedisService) {}

  async saveCnbStateValidation(
    id: string,
    data: CnbStateValidationDTO,
  ): Promise<void> {
    try {
      this.logger.log(`Saving cnb state validation for identification: ${id}`);
      const jsonString = JSON.stringify(data);
      await this.redisService.set(
        `cnb-state-validation:${id}`,
        jsonString,
        86400,
      );
    } catch (error) {
      this.logger.error(
        `Error saving cnb state validation for identification ${id}:`,
        error,
      );
      throw new Error(`Error saving cnb state validation: ${error.message}`);
    }
  }

  async getCnbStateValidation(
    id: string,
  ): Promise<CnbStateValidationDTO | null> {
    try {
      this.logger.log(
        `Retrieving cnb state validation for identification: ${id}`,
      );
      const data = await this.redisService.get(`cnb-state-validation:${id}`);
      if (!data) {
        this.logger.warn(
          `No cnb state validation found for identification: ${id}`,
        );
        return null;
      }

      if (typeof data === 'object' && data !== null) {
        return data as CnbStateValidationDTO;
      }

      if (typeof data === 'string') {
        try {
          return JSON.parse(data) as CnbStateValidationDTO;
        } catch (error) {
          this.logger.error(
            `Error parsing cnb state validation data from Redis for identification ${id}:`,
            error,
          );
          throw new Error(
            `Error parsing cnb state validation data: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error retrieving cnb state validation for identification ${id}:`,
        error,
      );
      throw error;
    }
  }
}
