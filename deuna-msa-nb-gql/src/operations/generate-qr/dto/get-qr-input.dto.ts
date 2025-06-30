import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class GetQrInput {
  @Field()
  @IsNotEmpty()
  transactionId: string;
}
