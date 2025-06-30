import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class EstablishmentInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  fullAddress: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  numberEstablishment: string;
}

@ObjectType('EstablishmentOutputDto')
export class EstablishmentOutputDto {
  @Field()
  fullAddress: string;

  @Field()
  numberEstablishment: string;
}

@ObjectType('EstablishmentValidateCnbOutputDto')
export class EstablishmentValidateCnbOutputDto {
  @Field()
  state: string;

  @Field()
  headquarters: string;

  @Field()
  fullAddress: string;

  @Field()
  establishmentType: string;

  @Field()
  numberEstablishment: string;

  @Field()
  commercialName: string;
}
