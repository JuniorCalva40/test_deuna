import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class QueryOnboardingStatusDto extends StandardizedResponse {
  @Field(() => [String])
  data: string[];

  @Field(() => [String])
  requiredSteps: string[];
}
