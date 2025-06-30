import { Module } from '@nestjs/common';
import { ConfirmDataResolver } from './confirm-data.resolver';
import { ConfirmDataService } from './services/confirm-data.service';
import { MsaNbOnboardingStatusServiceModule } from 'src/external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { HttpModule } from '@nestjs/axios';
import { MsaNbCnbOrqModule } from 'src/external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';

@Module({
  imports: [MsaNbOnboardingStatusServiceModule, HttpModule, MsaNbCnbOrqModule],
  providers: [ConfirmDataResolver, ConfirmDataService],
})
export class ConfirmDataModule {}
