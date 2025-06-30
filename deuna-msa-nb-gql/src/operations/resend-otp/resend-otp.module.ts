import { Module } from '@nestjs/common';
import { ResendOtpResolver } from './resend-otp.resolver';
import { ResendOtpService } from './service/resend-otp.service';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaCoAuthModule } from '../../external-services/msa-co-auth/msa-co-auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOnboardingStatusServiceModule, MsaCoAuthModule, HttpModule],
  providers: [ResendOtpResolver, ResendOtpService],
})
export class ResendOtpModule {}
