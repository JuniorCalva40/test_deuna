import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class SignContractInput {
  @Field()
  @IsUUID()
  sessionId: string;
}
