import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class ValidateDepositAccountResponse extends StandardizedResponse {

  @Field(() => String)
  message: string;

  @Field(() => String)
  beneficiaryAccountNumber: string;

  @Field(() => String)
  beneficiaryName: string;
}
