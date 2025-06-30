import { InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldWithApiProperty } from '../../../helper/FieldWithApiProperty';
import { TrackingBaseDto } from '../../../common/constants/common';
@InputType()
export class FacialAndLivenessValidationDto {
  @ApiProperty({ description: 'Base64 encoded image token 1' })
  @FieldWithApiProperty(() => String)
  @IsNotEmpty()
  @IsString()
  token1: string;

  @ApiProperty({ description: 'Base64 encoded image token 2' })
  @FieldWithApiProperty(() => String)
  @IsNotEmpty()
  @IsString()
  token2: string;

  @ApiProperty({ description: 'Validation method type (1-5)' })
  @FieldWithApiProperty(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  method: number;
}

@InputType()
export class StartBiometricValidationInputDto extends TrackingBaseDto {
  @ApiProperty({ description: 'Facial validation data' })
  @FieldWithApiProperty(() => FacialAndLivenessValidationDto)
  @ValidateNested()
  @Type(() => FacialAndLivenessValidationDto)
  facialAndLivenessValidation: FacialAndLivenessValidationDto;

  @ApiProperty({ description: 'Onboarding session id' })
  @FieldWithApiProperty(() => String)
  @IsNotEmpty()
  @IsString()
  onboardingSessionId: string;

  identificationNumber: string;
}

export class BiometricValidationBody {
  facialAndLivenessValidation: FacialAndLivenessValidationDto;
  onboardingSessionId: string;
}
