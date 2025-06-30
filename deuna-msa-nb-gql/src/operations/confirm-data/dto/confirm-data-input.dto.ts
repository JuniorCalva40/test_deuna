import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EstablishmentInputDto } from '../../../utils/establishment.dto';

@InputType()
export class ConfirmDataInputDto {
  @Field()
  @IsUUID()
  sessionId: string;

  @Field(() => EstablishmentInputDto)
  @ValidateNested()
  @Type(() => EstablishmentInputDto)
  establishment: EstablishmentInputDto;
}

@InputType()
export class DataConfigurationInputDto {
  @Field()
  configKey: string;

  @Field()
  configData: EstablishmentInputDto;

  @Field()
  cnbClientId: string;

  @Field()
  updatedBy: string;

  @Field()
  createdBy: string;
}

@InputType()
export class UpdateDataOboardingInputDto {
  @Field()
  @IsUUID()
  sessionId: string;

  @Field()
  @IsString()
  status: string;

  @Field()
  @IsString()
  establishment: EstablishmentInputDto;
}
