import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class AcceptBillingInput {
  @Field()
  @IsUUID()
  sessionId: string;
}
