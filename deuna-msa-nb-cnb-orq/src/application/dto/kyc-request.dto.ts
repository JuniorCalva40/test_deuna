import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { FacialValidationDto } from './facial-validation.dto';
import { LivenessValidationDto } from './liveness-validation.dto';
import { TrackingInfoDto } from '../../infrastructure/constants/common';
/**
 * DTO for the KYC validation request
 * Contains the data necessary to perform biometric validations
 */
export class KycRequestDto {
  @IsNotEmpty()
  @IsString()
  scanId: string;

  @IsNotEmpty()
  @IsObject()
  facialValidation: FacialValidationDto;

  @IsNotEmpty()
  @IsObject()
  livenessValidation: LivenessValidationDto;

  @IsNotEmpty()
  @IsObject()
  trackingInfo: TrackingInfoDto;

  @IsNotEmpty()
  @IsString()
  onboardingSessionId: string;
}
