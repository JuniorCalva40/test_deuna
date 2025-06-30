import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class GenerateQrResponse extends StandardizedResponse {
  @Field()
  qrBase64: string;

  @Field()
  transactionId: string;

  @Field()
  qrUrl: string;

  @Field()
  qrId: string;
}
