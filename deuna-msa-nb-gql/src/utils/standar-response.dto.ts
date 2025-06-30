import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class ErrorDetail {
  @Field()
  message: string;

  @Field()
  code: string;
}

@ObjectType()
export class StandardizedResponse {
  @Field()
  status: string;

  @Field(() => [ErrorDetail], { nullable: true })
  errors?: ErrorDetail[];
}
