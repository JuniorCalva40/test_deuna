import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class SignContractResponseDetails {
  @Field({ nullable: true })
  errorMessage?: string;

  @Field()
  getOtpDataResult: string;
}

@ObjectType()
export class SignContractResponse extends StandardizedResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  errorCode?: string;

  @Field(() => SignContractResponseDetails, { nullable: true })
  details?: SignContractResponseDetails;
}
