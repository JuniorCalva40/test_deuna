import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class CommissionsButtonStatusResponseDto extends StandardizedResponse {
  
  @Field()
  message: string;
}