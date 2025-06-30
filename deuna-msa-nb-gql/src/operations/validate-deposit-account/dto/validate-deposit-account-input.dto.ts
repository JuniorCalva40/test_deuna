import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class ValidateDepositAccountInput {
  @Field(() => String)
  @IsNotEmpty()
  beneficiaryPhoneNumber: string;
}

export class ValidateDepositAccountServiceInput {
  trackingId: string;
  beneficiaryPhoneNumber: string;
}
