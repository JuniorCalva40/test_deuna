import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

import { FieldWithApiProperty } from '../../../helper/FieldWithApiProperty';
import { EstablishmentInputDto } from '../../../utils/establishment.dto';
import { TrackingBaseDto } from '../../../common/constants/common';

@InputType()
export class ConfirmDataInputDto extends TrackingBaseDto {
  @ApiProperty({ description: 'Unique Session ID' })
  @FieldWithApiProperty(() => String)
  @IsString()
  @IsNotEmpty()
  onboardingSessionId: string;

  @ApiProperty({
    description: 'CNB establishment with full address and number',
  })
  @FieldWithApiProperty(() => EstablishmentInputDto)
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => EstablishmentInputDto)
  establishment: EstablishmentInputDto;

  identificationNumber: string;
}

@InputType()
export class DataConfigurationInputDto {
  @Field({ description: 'CNB configuration key which is establishment' })
  configKey: string;

  @Field({
    description:
      'CNB information such as address and number of the establishment',
  })
  configData: EstablishmentInputDto;

  @Field({ description: 'CNB ID' })
  cnbClientId: string;

  @Field()
  updatedBy: string;

  @Field()
  createdBy: string;
}

@InputType()
export class UpdateDataOboardingInputDto {
  @Field()
  sessionId: string;

  @Field()
  @IsString()
  status: string;

  @Field()
  @IsString()
  establishment: EstablishmentInputDto;
}
