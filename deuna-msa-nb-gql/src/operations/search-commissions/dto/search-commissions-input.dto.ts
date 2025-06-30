import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';

@InputType()
export class SearchCommissionsInputDto {
  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  page: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  size: number;

  @Field(() => String)
  @IsNotEmpty()
  startMonth: string;

  @Field(() => String)
  @IsNotEmpty()
  endMonth: string;
}
