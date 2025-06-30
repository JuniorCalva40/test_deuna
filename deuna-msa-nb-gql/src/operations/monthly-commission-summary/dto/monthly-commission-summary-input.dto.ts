import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class MonthlyCommissionSummaryInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  startMonth: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  endMonth: string;
}
