import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class GenerateOtpRespDto {
  @Field()
  expirationDate: string;

  @Field()
  remainingResendAttempts: number;
}

@ObjectType()
export class AcceptContractDataResponseDto extends StandardizedResponse {
  @Field()
  onboardingSessionId: string;

  @Field()
  requestId: string;

  @Field(() => GenerateOtpRespDto)
  otpResponse: GenerateOtpRespDto;

  @Field()
  email: string;
}
