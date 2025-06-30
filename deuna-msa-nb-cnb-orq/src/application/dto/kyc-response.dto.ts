import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for KYC operation responses
 * Contains the unique identifier of the KYC validation session
 */
export class KycResponseDto {
  @ApiProperty({
    description: 'Identificador único de la sesión de validación KYC',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  scanId: string;
}
