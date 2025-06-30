import { ApiProperty } from '@nestjs/swagger';

export class ElectronicSignatureUpdateResponseDto {
  @ApiProperty({
    description: 'Update status',
    example: 'UPDATED',
    enum: ['UPDATED', 'FAILED'],
  })
  status: string;

  @ApiProperty({
    description: 'Descriptive message of the result',
    example: 'Electronic signature request updated successfully',
  })
  message: string;
}
