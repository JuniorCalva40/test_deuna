import { IsString, Length } from 'class-validator';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@InputType()
export class ValidateOtpInputDto {
  @IsString()
  @Length(6, 6)
  @Field()
  otp: string;

  @IsString()
  @Field()
  sessionId: string;

  @IsString()
  @Field()
  businessDeviceId: string;

  @IsString()
  @Field()
  requestId: string;
}

@ObjectType()
export class DataGenerateOtpRespDto {
  @Field()
  message?: string;

  @Field({ nullable: true })
  remainingResendAttempts?: number | null;
}

@ObjectType()
export class ValidateOtpResponseDto extends StandardizedResponse {
  @Field()
  isVerifiedOtp: boolean;

  @Field(() => DataGenerateOtpRespDto)
  otpResponse: DataGenerateOtpRespDto;
}
