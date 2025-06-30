import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class UploadClientsFileResponse extends StandardizedResponse {
  @Field(() => String)
  message: string;

  @Field(() => Number)
  totalProcessed: number;

  @Field(() => [String])
  skippedRecords: string[];
}
