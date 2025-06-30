import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';

@ObjectType()
export class initiateDepositResponseDto {
  @Field(() => String)
  accountNumber: string;

  @Field(() => String)
  beneficiaryName: string;

  @Field(() => String)
  identification: string;
}
