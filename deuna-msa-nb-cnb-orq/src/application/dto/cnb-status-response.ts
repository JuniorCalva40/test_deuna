import { ApiProperty } from '@nestjs/swagger';

export class CnbStatusResponseDto {
  @ApiProperty({
    description: 'Identificador del node de cnb',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  nodeId: string;
}
