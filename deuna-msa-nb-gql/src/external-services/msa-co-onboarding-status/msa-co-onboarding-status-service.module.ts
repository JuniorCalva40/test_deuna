import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { msaNbOnboardingStatusServiceProvider } from './providers/msa-co-onboarding-status-provider';
import { RestMsaCoOnboardingStatusService } from './services/rest-msa-co-onboarding-status.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    msaNbOnboardingStatusServiceProvider,
    RestMsaCoOnboardingStatusService,
  ],
  exports: [msaNbOnboardingStatusServiceProvider],
})
export class MsaNbOnboardingStatusServiceModule {}
