import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TransactionChannelType } from '../../../common/constants/common';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class Transaction {
  @Field()
  id: string;

  @Field()
  amount: number;

  @Field()
  currency: string;

  @Field()
  date: string;

  @Field()
  source: string;

  @Field()
  type: TransactionChannelType;

  @Field()
  description: string;
}

@ObjectType()
export class GetCnbTransactionsResponse extends StandardizedResponse {
  @Field(() => Int)
  totalElements: number;
  @Field(() => Int)
  totalPages: number;
  @Field(() => Int)
  currentPage: number;

  @Field(() => [Transaction])
  transactions: Transaction[];
}
