import { ApiProperty } from '@nestjs/swagger';
import { ValidationStatus } from '../../domain/entities/validation-status.enum';

export class KycStatusDto {
  @ApiProperty({ enum: ValidationStatus })
  liveness: ValidationStatus;

  @ApiProperty({ enum: ValidationStatus })
  facial: ValidationStatus;
}
