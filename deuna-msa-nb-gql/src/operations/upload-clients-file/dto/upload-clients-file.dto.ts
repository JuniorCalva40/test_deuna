import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class UploadClientsFileResponse extends StandardizedResponse {
  @Field(() => String)
  message: string;

  @Field(() => Number, {
    description: 'number of records to be processed in the file',
  })
  totalProcessed: number;

  @Field(() => [String])
  skippedRecords: string[];
}
