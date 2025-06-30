import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

@InputType()
export class ValidateBalanceInputDto {
  @Field({ description: 'amount to be validated based on the transaction' })
  @IsNumber()
  @IsNotEmpty()
  ammount: number;
}

@InputType()
export class ValidateBalanceServiceInput {
  @Field()
  @IsNumber()
  @IsNotEmpty()
  ammount: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  identification: string;
}
