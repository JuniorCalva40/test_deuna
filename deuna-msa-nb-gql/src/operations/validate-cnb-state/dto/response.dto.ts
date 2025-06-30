import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class ErrorDto {
  @Field()
  code: string;

  @Field()
  message: string;
}

@ObjectType()
export class DataResponse extends StandardizedResponse {
  @Field()
  cnbState: string;

  @Field(() => [ErrorDto], { nullable: true })
  errors?: ErrorDto[];
}
