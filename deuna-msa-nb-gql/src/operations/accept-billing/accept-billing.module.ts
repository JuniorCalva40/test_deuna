import { Module } from '@nestjs/common';
import { AcceptBillingResolver } from './accept-billing.resolver';
import { AcceptBillingService } from './services/accept-billing.service';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { SERVICE_NAME } from 'src/common/constants/common';

@Module({
  imports: [
    MsaNbOnboardingStatusServiceModule,
    LoggerModule.forRoot({
      context: `${SERVICE_NAME} - AcceptBillingModule`,
    }),
  ],
  providers: [AcceptBillingResolver, AcceptBillingService],
})
export class AcceptBillingModule {}
