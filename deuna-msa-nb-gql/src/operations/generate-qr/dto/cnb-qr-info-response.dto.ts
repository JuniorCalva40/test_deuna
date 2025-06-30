import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CnbQrInfoResponse {
  @Field()
  status: string;

  @Field()
  cnbAccount: string;

  @Field()
  amount: number;

  @Field({ nullable: true }) // Now nullable
  peopleAccount?: string;

  @Field({ nullable: true }) // Now nullable
  peopleName?: string;

  @Field({ nullable: true })
  transactionNumber?: string;

  @Field({ nullable: true })
  transactionDate?: string;
}
