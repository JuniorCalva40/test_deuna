import { IsNotEmpty, IsUUID, IsISO8601, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum for the KYC validation types supported
 */
export enum KycValidationType {
  LIVENESS = 'liveness',
  FACIAL = 'facial',
}

/**
 * DTO for the KYC validation messages
 * Represents the expected structure in the Kafka messages
 */
export class KycValidationMessageDto {
  @ApiProperty({
    description: 'Identificador único del proceso de validación KYC',
    example: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
  })
  @IsNotEmpty()
  @IsUUID()
  scanId: string;

  @ApiProperty({
    description: 'Tipo de validación a realizar',
    example: 'facial',
    enum: KycValidationType,
  })
  @IsNotEmpty()
  @IsEnum(KycValidationType, {
    message: 'El tipo debe ser "liveness" o "facial"',
  })
  type: string;

  @ApiProperty({
    description: 'Fecha y hora en que se generó el mensaje',
    example: '2025-03-06T06:06:29.741Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  timestamp: string;
}
