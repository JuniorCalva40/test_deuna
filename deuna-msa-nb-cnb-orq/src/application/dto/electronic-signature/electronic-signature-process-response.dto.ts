import { ApiProperty } from '@nestjs/swagger';

export class ElectronicSignatureProcessResponseDto {
  @ApiProperty({
    description: 'Estado del procesamiento',
    example: 'PROCESSED',
    enum: ['PROCESSED', 'FAILED', 'NOT_FOUND'],
  })
  status: string;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'La solicitud de firma electrónica ha sido procesada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de referencia de la solicitud procesada',
    example: 'DS-2023-001234',
    required: false,
  })
  referenceTransaction?: string;
}
