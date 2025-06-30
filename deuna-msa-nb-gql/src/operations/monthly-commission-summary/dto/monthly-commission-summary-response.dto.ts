import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class MonthlyCommissionSummary {
  @Field()
  month: string;

  @Field(() => Float)
  monthlyTotal: number;

  @Field(() => Int)
  monthlyCount: number;
}

@ObjectType()
export class MonthlyCommissionSummaryResponse extends StandardizedResponse {
  @Field(() => [MonthlyCommissionSummary])
  summary: MonthlyCommissionSummary[];
}
