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
