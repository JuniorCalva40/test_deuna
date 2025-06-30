import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';
import { EstablishmentOutputDto } from '../../../utils/establishment.dto';

@ObjectType()
export class StartOnboardingResponse extends StandardizedResponse {
  @Field()
  sessionId: string;

  @Field(() => [EstablishmentOutputDto])
  establishments: EstablishmentOutputDto[];
}
