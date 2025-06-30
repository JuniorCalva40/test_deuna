import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class InitiateDepositResponse extends StandardizedResponse {
  @Field(() => String)
  accountNumber: string;

  @Field(() => String)
  beneficiaryName: string;

  @Field(() => String)
  identification: string;
}
