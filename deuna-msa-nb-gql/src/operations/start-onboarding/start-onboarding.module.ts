import { Module } from '@nestjs/common';
import { StartOnboardingResolver } from './start-onboarding.resolver';
import { StartOnboardingService } from './service/start-onboarding.service';
import { MsaCoCommerceServiceModule } from 'src/external-services/msa-co-commerce/msa-co-commerce-service.module';
import { MsaNbClientModule } from 'src/external-services/msa-nb-client/msa-nb-client.module';
import { MsaNbOnboardingStatusServiceModule } from 'src/external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MsaCoCommerceServiceModule,
    MsaNbClientModule,
    MsaNbOnboardingStatusServiceModule,
    HttpModule,
  ],
  providers: [StartOnboardingResolver, StartOnboardingService],
})
export class StartOnboardingModule {}
