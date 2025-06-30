import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FacialValidationDto } from './facial-validation.dto';
import { LivenessValidationDto } from './liveness-validation.dto';

/**
 * DTO for the biometric requests of KYC
 */
export class KycBiometricRequestDto {
  @ApiProperty({
    description: 'Identificador único de la validación',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsNotEmpty()
  @IsString()
  scanId: string;

  @ApiProperty({
    description: 'Datos para la validación facial',
    type: FacialValidationDto,
  })
  @ValidateNested()
  @Type(() => FacialValidationDto)
  @IsNotEmpty()
  facialValidation: FacialValidationDto;

  @ApiProperty({
    description: 'Datos para la validación de liveness',
    type: LivenessValidationDto,
  })
  @ValidateNested()
  @Type(() => LivenessValidationDto)
  @IsNotEmpty()
  livenessValidation: LivenessValidationDto;

  @ApiProperty({
    description: 'Identificador único de la sesión de onboarding',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsNotEmpty()
  @IsString()
  onboardingSessionId: string;
}
