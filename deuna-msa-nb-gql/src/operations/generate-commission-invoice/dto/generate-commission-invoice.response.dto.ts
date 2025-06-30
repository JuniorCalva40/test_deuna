import { Field, ObjectType } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class GenerateCommissionInvoiceResponseDto extends StandardizedResponse {
  @Field(() => String, {
    description: 'The message of the response.',
  })
  message: string;
}
