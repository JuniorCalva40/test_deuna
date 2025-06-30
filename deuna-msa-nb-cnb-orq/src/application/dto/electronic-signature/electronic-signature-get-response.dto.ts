import { ApiProperty } from '@nestjs/swagger';
import { ElectronicSignatureRequestDto } from './electronic-signature-redis-request.dto';

export class ElectronicSignatureGetResponseDto {
  @ApiProperty({
    description: 'Estado de la consulta',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'NOT_FOUND', 'ERROR'],
  })
  status: string;

  @ApiProperty({
    description: 'Descriptive message of the result',
    example: 'Electronic signature request retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Electronic signature request data',
    type: ElectronicSignatureRequestDto,
    required: false,
  })
  data?: ElectronicSignatureRequestDto;
}
