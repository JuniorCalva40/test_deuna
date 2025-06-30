import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ValidateBalanceResponse {
  @Field()
  totalBalance: number;

  @Field()
  overdraftAmount: number;

  @Field()
  technicalOverdraftAmount: number;

  @Field()
  lockedBalance: number;

  @Field()
  holdBalance: number;

  @Field()
  availableBalance: number;

  @Field()
  overdraftInterestDue: number;

  @Field()
  technicalOverdraftInterestDue: number;

  @Field()
  feesDue: number;

  @Field()
  blockedBalance: number;

  @Field()
  forwardAvailableBalance: number;
}
