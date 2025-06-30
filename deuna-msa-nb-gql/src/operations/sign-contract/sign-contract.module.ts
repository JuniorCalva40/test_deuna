import { Module } from '@nestjs/common';
import { SignContractResolver } from './sign-contract.resolver';
import { SignContractService } from './service/sign-contract.service';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { SERVICE_NAME } from 'src/common/constants/common';
import { MsaNbOnboardingStatusServiceModule } from 'src/external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { HttpModule } from '@nestjs/axios';
import { MsaNbCnbOrqModule } from 'src/external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';
import { MsaTlTemplateGeneratorModule } from 'src/external-services/msa-tl-template-generator/msa-tl-template-generator.module';
import { MsaTlNotificationEmailModule } from 'src/external-services/msa-tl-notification-email/msa-tl-notification-email.module';
import { DeunaMsaMcBoConfigurationModule } from 'src/external-services/msa-mc-bo-configuration/deuna-msa-mc-bo-configuration.module';

@Module({
  imports: [
    MsaNbOnboardingStatusServiceModule,
    MsaNbCnbOrqModule,
    MsaTlTemplateGeneratorModule,
    MsaTlNotificationEmailModule,
    DeunaMsaMcBoConfigurationModule,
    HttpModule,
    LoggerModule.forRoot({
      context: `${SERVICE_NAME} - SignContractModule`,
    }),
  ],
  providers: [SignContractResolver, SignContractService],
})
export class SignContractModule {}
