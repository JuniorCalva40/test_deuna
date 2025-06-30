import { Module } from '@nestjs/common';
import { QueryOnboardingStatusResolver } from './query-onboarding-status.resolver';
import { QueryOnboardingStatusService } from './services/query-onboarding-status.service';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOnboardingStatusServiceModule, HttpModule],
  providers: [QueryOnboardingStatusResolver, QueryOnboardingStatusService],
})
export class QueryOnboardingStatusModule {}
