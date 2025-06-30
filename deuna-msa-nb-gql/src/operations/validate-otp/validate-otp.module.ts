import { Module } from '@nestjs/common';
import { ValidateOtpResolver } from './validate-otp.resolver';
import { ValidateOtpService } from './service/validate-otp.service';
import { HttpModule } from '@nestjs/axios';
import { MsaCoAuthModule } from 'src/external-services/msa-co-auth/msa-co-auth.module';
import { MsaNbOnboardingStatusServiceModule } from 'src/external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaNbClientModule } from 'src/external-services/msa-nb-cnb-service/msa-nb-client.module';

@Module({
  imports: [
    HttpModule,
    MsaNbOnboardingStatusServiceModule,
    MsaCoAuthModule,
    MsaNbClientModule,
  ],
  providers: [ValidateOtpResolver, ValidateOtpService],
})
export class ValidateOtpModule {}
