import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class ValidateBalanceInput {
  @ApiProperty({ description: 'Account ID' })
  @Field({ description: 'Account ID' })
  @IsNotEmpty()
  @IsString()
  accountId: string;
}
