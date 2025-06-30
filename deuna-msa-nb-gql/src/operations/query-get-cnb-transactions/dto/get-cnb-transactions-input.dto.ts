import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionChannelType } from '../../../common/constants/common';

@InputType()
export class GetCnbTransactionsInput {
  @Field(() => String)
  @IsISO8601({}, { message: 'fromDate must be a valid ISO 8601 date string' })
  @IsString()
  @IsNotEmpty({ message: 'fromDate must not be empty' })
  fromDate: string;

  @Field(() => String)
  @IsISO8601({}, { message: 'toDate must be a valid ISO 8601 date string' })
  @IsString()
  @IsNotEmpty({ message: 'toDate must not be empty' })
  toDate: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  transacitonType?: TransactionChannelType;

  @Field(() => Int)
  @IsInt({ message: 'page must be a integer' })
  @Min(0, { message: 'page must not be less than 0' })
  page: number;

  @Field(() => Int)
  @IsInt({ message: 'size must be a integer' })
  @Min(1, { message: 'size must not be less than 1' })
  size: number;
}
