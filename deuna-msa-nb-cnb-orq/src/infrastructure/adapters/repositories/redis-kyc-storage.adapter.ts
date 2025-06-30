import { KycRequestDto } from '../../../application/dto/kyc-request.dto';
import { KycStoragePort } from '../../../application/ports/out/storage/kyc-storage.port';
import { Injectable, Logger } from '@nestjs/common';
import { KycStatusDto } from '../../../application/dto/kyc-status.dto';
import { RedisService } from '@deuna/tl-cache-nd';
import { FacialValidationDto } from '../../../application/dto/facial-validation.dto';
import { LivenessValidationDto } from '../../../application/dto/liveness-validation.dto';
import { TrackingInfoDto } from '../../../infrastructure/constants/common';
@Injectable()
export class RedisKycStorageAdapter implements KycStoragePort {
  private readonly logger = new Logger(RedisKycStorageAdapter.name);

  constructor(private readonly redisService: RedisService) {}

  async saveKycRequestRedis(
    scanId: string,
    data: {
      facialValidation: FacialValidationDto;
      livenessValidation: LivenessValidationDto;
      trackingInfo: TrackingInfoDto;
    },
  ): Promise<void> {
    await this.redisService.set(`kyc:${scanId}`, JSON.stringify(data));
  }

  async saveValidationResultRedis(
    scanId: string,
    type: 'liveness' | 'facial',
    result: any,
  ): Promise<void> {
    await this.redisService.set(
      `kyc:${scanId}:${type}`,
      JSON.stringify(result),
    );
  }

  async getKycData(scanId: string): Promise<KycRequestDto> {
    try {
      const data = await this.redisService.get(`kyc:${scanId}`);

      // If no data, return null
      if (!data) {
        this.logger.warn(`KYC data not found for scanId: ${scanId}`);
        return null;
      }

      // If it's already an object, return it directly
      if (typeof data === 'object' && data !== null) {
        return data;
      }

      // If it's a string, try to parse it as JSON
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (error) {
          this.logger.error(
            `Error parsing KYC data from Redis for scanId ${scanId}:`,
            error,
          );
          throw new Error(`Error parsing KYC data: ${error.message}`);
        }
      }

      this.logger.warn(
        `Unexpected data type for scanId ${scanId}: ${typeof data}`,
      );
      return null;
    } catch (error) {
      this.logger.error(`Error getting KYC data for scanId ${scanId}:`, error);
      throw error;
    }
  }

  async getValidationResultsRedis(scanId: string): Promise<KycStatusDto> {
    try {
      const liveness = await this.redisService.get(`kyc:${scanId}:liveness`);
      const facial = await this.redisService.get(`kyc:${scanId}:facial`);

      return {
        liveness: this.parseSafely(liveness, 'liveness', scanId),
        facial: this.parseSafely(facial, 'facial', scanId),
      };
    } catch (error) {
      this.logger.error(
        `Error getting validation results for scanId ${scanId}:`,
        error,
      );
      throw error;
    }
  }

  private parseSafely(data: any, type: string, scanId: string): any {
    if (!data) {
      return null;
    }

    if (typeof data === 'object' && data !== null) {
      return data;
    }

    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        this.logger.error(
          `Error parsing ${type} data from Redis for scanId ${scanId}:`,
          error,
        );
        return null;
      }
    }

    return null;
  }
}
