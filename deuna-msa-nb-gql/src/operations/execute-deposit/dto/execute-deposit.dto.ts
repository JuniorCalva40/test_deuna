import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@InputType()
export class ExecuteDepositInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}

@ObjectType()
export class ExecuteDepositResponse extends StandardizedResponse {
  @Field(() => String)
  message: string;
}
