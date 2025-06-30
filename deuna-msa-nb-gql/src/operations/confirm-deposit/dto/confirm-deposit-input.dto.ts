import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ConfirmDepositInput {
  @Field(() => String)
  transactionId: string;
}

export class ConfirmDepositServiceInput {
  trackingId: string;
  transactionId: string;
  deviceId: string;
}
