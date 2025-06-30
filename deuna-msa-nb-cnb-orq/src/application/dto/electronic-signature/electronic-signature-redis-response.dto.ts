import { ApiProperty } from '@nestjs/swagger';

export class ElectronicSignatureResponseDto {
  @ApiProperty({
    description: 'Status of the request',
    example: 'SAVED',
    enum: ['SAVED', 'UPDATED', 'ERROR'],
  })
  status: string;

  @ApiProperty({
    description: 'Descriptive message of the result',
    example: 'Electronic signature request saved successfully in redis-db',
  })
  message: string;
}
