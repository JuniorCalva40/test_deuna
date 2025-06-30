import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsEmail } from 'class-validator';

@InputType()
export class AcceptContractDataInputDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  businessDeviceId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  deviceName: string;
}

@InputType()
export class GenerateOtpInputDto {
  @Field()
  @IsUUID()
  businessDeviceId: string;

  @Field()
  @IsUUID()
  requestId: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  deviceName: string;

  @Field()
  @IsString()
  commerceName: string;

  // TODO: pendiente por definir si se envia por email o sms desde el frontend
  notificationChannel: string[];
}

@InputType()
export class UpdateDataOnboardingInputDto {
  @Field()
  @IsString()
  status: string;
}
