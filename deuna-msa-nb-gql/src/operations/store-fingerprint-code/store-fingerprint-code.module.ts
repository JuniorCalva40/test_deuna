import { Module } from '@nestjs/common';
import { StoreFingeprintCodeResolver } from './store-fingerprint-code.resolver';
import { StoreFingeprintCodeService } from './services/store-fingerprint-code.service';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { HttpModule } from '@nestjs/axios';
import { MsaNbCnbOrqModule } from '../../external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';

@Module({
  imports: [MsaNbOnboardingStatusServiceModule, HttpModule, MsaNbCnbOrqModule],
  providers: [StoreFingeprintCodeResolver, StoreFingeprintCodeService],
})
export class StoreFingeprintCodeModule {}
