import { Module } from '@nestjs/common';
import { ResendOtpResolver } from './resend-otp.resolver';
import { ResendOtpService } from './service/resend-otp.service';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaCoAuthModule } from '../../external-services/msa-co-auth/msa-co-auth.module';
import { HttpModule } from '@nestjs/axios';
import { MsaNbClientModule } from 'src/external-services/msa-nb-cnb-service/msa-nb-client.module';

@Module({
  imports: [
    MsaNbOnboardingStatusServiceModule,
    MsaCoAuthModule,
    HttpModule,
    MsaNbClientModule,
  ],
  providers: [ResendOtpResolver, ResendOtpService],
})
export class ResendOtpModule {}
