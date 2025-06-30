import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class InitiateCellPhoneDepositResponse extends StandardizedResponse {
  @Field(() => String)
  message: string;

  @Field(() => String)
  beneficiaryAccountNumber: string;

  @Field(() => String)
  beneficiaryName: string;

  @Field(() => String)
  ordererName: string;

  @Field(() => String)
  ordererAccountNumber: string;

  @Field(() => String)
  transactionId: string;
}
