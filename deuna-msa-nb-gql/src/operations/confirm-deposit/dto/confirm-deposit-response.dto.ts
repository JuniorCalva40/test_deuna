import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class ConfirmDepositResponse extends StandardizedResponse {
  @Field(() => String)
  message: string;

  @Field(() => String, { nullable: true })
  transactionNumber: string;

  @Field(() => String, { nullable: true })
  transactionDate: string;
}
