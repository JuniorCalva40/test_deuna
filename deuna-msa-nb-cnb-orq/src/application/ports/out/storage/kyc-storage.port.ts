import { LivenessValidationDto } from '../../../dto/liveness-validation.dto';
import { FacialValidationDto } from '../../../dto/facial-validation.dto';
import { KycRequestDto } from '../../../dto/kyc-request.dto';
import { KycStatusDto } from '../../../dto/kyc-status.dto';

export const KYC_STORAGE_PORT = 'KYC_STORAGE_PORT' as const;

export interface KycStoragePort {
  saveKycRequestRedis(
    scanId: string,
    data: {
      facialValidation: FacialValidationDto;
      livenessValidation: LivenessValidationDto;
    },
  ): Promise<void>;
  saveValidationResultRedis(
    scanId: string,
    type: 'liveness' | 'facial',
    result: any,
  ): Promise<void>;
  getKycData(scanId: string): Promise<KycRequestDto>;
  getValidationResultsRedis(scanId: string): Promise<KycStatusDto>;
}
