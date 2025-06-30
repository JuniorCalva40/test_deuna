import { ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { FieldWithApiProperty } from '../../../helper/FieldWithApiProperty';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class StartBiometricValidationResponseDto extends StandardizedResponse {
  @ApiProperty({ description: 'Unique scan identification' })
  @FieldWithApiProperty(() => String)
  scanId: string;
}

export class ISaveElectronicSignatureResponseRedis {
  status: string;
  message: string;
}
