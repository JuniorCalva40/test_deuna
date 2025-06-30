import { LivenessValidationDto } from '../../../dto/liveness-validation.dto';
import { FacialValidationDto } from '../../../dto/facial-validation.dto';
import { ValidationStatus } from '../../../../domain/entities/validation-status.enum';

/**
 * Interface for validation results
 */
export interface ValidationResult {
  success: boolean;
  status: ValidationStatus;
  error?: string;
  score?: number;
  timestamp: string;
  details?: Record<string, any>;
}

/**
 * Port for communication with the KYC microservice
 * Defines the available biometric validation operations
 */
export const KYC_CLIENT_PORT = 'KYC_CLIENT_PORT' as const;

export interface KycClientPort {
  /**
   * Executes the liveness validation (life test)
   * @param data Data necessary for liveness validation
   * @param headers Additional headers to include in the request
   * @returns Validation result
   */
  validateLiveness(
    data: LivenessValidationDto,
    headers?: Record<string, string>,
  ): Promise<ValidationResult>;

  /**
   * Executes the facial match validation
   * @param data Data necessary for facial validation
   * @param headers Additional headers to include in the request
   * @returns Validation result
   */
  validateFacialMatch(
    data: FacialValidationDto,
    headers?: Record<string, string>,
  ): Promise<ValidationResult>;
}
