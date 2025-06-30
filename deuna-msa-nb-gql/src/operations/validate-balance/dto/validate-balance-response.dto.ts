import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ValidateBalanceResponseDto {
  @Field()
  availableBalance: number;

  @Field()
  isValidAmmount: boolean;
}
