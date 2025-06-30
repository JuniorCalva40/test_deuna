import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ParseAmount } from '../../../core/decorators/parse-amount.decorator';

@InputType()
export class GenerateQrInput {
  @Field(() => String)
  @IsNotEmpty()
  @ParseAmount({ min: 0.01 })
  amount: string;
}
