import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@InputType()
export class ResendOtpInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  sessionId: string;
}

@ObjectType()
export class ResendOtpResponse extends StandardizedResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  expirationDate?: string;

  @Field({ nullable: true })
  remainingResendAttempts?: number;
}

export class BodySendOtpDto {
  businessDeviceId: string;
  deviceName: string;
  commerceName: string;
  email: string;
  requestId: string;
  notificationChannel: string[];
}
