import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class DocumentValidationResponse extends StandardizedResponse {
  @Field()
  statusValidation: string;
}

export interface ISaveElectronicSignatureResponseRedis {
  status: string;
  message: string;
}
