import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class QueryDocumentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  templateName: string;
}

export class QueryDataDocument {
  presignedUrl: string;
  b64encoded: string;
}
