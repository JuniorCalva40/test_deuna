import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ResendOtpInput, ResendOtpResponse } from './dto/resend-otp.dto';
import { ResendOtpService } from './service/resend-otp.service';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class ResendOtpResolver {
  constructor(private readonly resendOtpService: ResendOtpService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Mutation(() => ResendOtpResponse)
  async resendOtp(
    @Args('input') input: ResendOtpInput,
  ): Promise<ResendOtpResponse> {
    return this.resendOtpService.resendOtp(input);
  }
}
