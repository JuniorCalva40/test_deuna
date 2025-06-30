import { Field } from '@nestjs/graphql';
import { IsNumber, IsString } from 'class-validator';

export class GenerateOtpResponseDto {
  @Field()
  @IsString()
  expirationDate: string;

  @Field()
  @IsNumber()
  remainingResendAttempts: number;
}
