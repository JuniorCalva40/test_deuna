import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class QueryDocumentData {
  @Field()
  presignedUrl: string;

  @Field()
  b64encoded: string;
}

@ObjectType()
export class QueryDocumentResponse extends StandardizedResponse {
  @Field()
  message: string;

  @Field()
  data: QueryDocumentData;
}
