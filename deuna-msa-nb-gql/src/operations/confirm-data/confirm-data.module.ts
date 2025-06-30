import { Module } from '@nestjs/common';
import { ConfirmDataResolver } from './confirm-data.resolver';
import { ConfirmDataService } from './services/confirm-data.service';
import { MsaNbOnboardingStatusServiceModule } from 'src/external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaNbConfigurationServiceModule } from 'src/external-services/msa-nb-configuration/msa-nb-configuration-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MsaNbOnboardingStatusServiceModule,
    MsaNbConfigurationServiceModule,
    HttpModule,
  ],
  providers: [ConfirmDataResolver, ConfirmDataService],
})
export class ConfirmDataModule {}
