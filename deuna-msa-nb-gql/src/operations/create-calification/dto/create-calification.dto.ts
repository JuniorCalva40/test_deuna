import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

import { FieldWithApiProperty } from '../../../helper/FieldWithApiProperty';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@InputType()
export class CreateCalificationInput {
  @ApiProperty({ description: 'Value of the rating from 0, 2 or 4' })
  @FieldWithApiProperty(() => Int)
  rating: number;

  @ApiProperty({ description: 'Comment of the calification' })
  @Field({ nullable: true })
  comments?: string;

  @ApiProperty({
    description:
      'Product and Transaction type to be rated, example: "cnb/deposito"',
  })
  @FieldWithApiProperty(() => String)
  context: string;
}

@ObjectType()
export class CreateCalificationResponse extends StandardizedResponse {
  @Field()
  status: string;
}
