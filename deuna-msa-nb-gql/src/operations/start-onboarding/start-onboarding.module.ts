import { Module } from '@nestjs/common';
import { StartOnboardingResolver } from './start-onboarding.resolver';
import { StartOnboardingService } from './service/start-onboarding.service';
import { MsaCoCommerceServiceModule } from '../../external-services/msa-co-commerce/msa-co-commerce-service.module';
import { MsaNbClientModule } from '../../external-services/msa-nb-cnb-service/msa-nb-client.module';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { HttpModule } from '@nestjs/axios';
import { DeunaMsaMcBoConfigurationModule } from '../../external-services/msa-mc-bo-configuration/deuna-msa-mc-bo-configuration.module';
import { MsaBoMcClientModule } from '../../external-services/msa-mc-bo-client/msa-mc-bo-client.service.module';
import { MsaMcBoHierarchyModule } from '../../external-services/msa-mc-bo-hierarchy/msa-mc-bo-hierarchy.module';
import { MsaNbCnbOrqModule } from '../../external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';

@Module({
  imports: [
    MsaCoCommerceServiceModule,
    MsaNbClientModule,
    MsaNbOnboardingStatusServiceModule,
    HttpModule,
    DeunaMsaMcBoConfigurationModule,
    MsaMcBoHierarchyModule,
    MsaBoMcClientModule,
    MsaNbCnbOrqModule,
  ],
  providers: [StartOnboardingResolver, StartOnboardingService],
})
export class StartOnboardingModule {}
