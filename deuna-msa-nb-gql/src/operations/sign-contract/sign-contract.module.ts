import { Module } from '@nestjs/common';
import { SignContractResolver } from './sign-contract.resolver';
import { SignContractService } from './service/sign-contract.service';
import { MsaCoInvoiceModule } from '../../external-services/msa-co-invoice/msa-co-invoice.module';
import { MsaNbClientModule } from '../../external-services/msa-nb-client/msa-nb-client.module';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { SERVICE_NAME } from 'src/common/constants/common';
import { MsaCoAuthModule } from 'src/external-services/msa-co-auth/msa-co-auth.module';
import { MsaNbOnboardingStatusServiceModule } from 'src/external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaCoDocumentModule } from 'src/external-services/msa-co-document/msa-co-document.module';
import { MsaTlTemplateGeneratorModule } from 'src/external-services/msa-tl-template-generator/msa-tl-template-generator.module';
import { MsaTlNotificationEmailModule } from 'src/external-services/msa-tl-notification-email/msa-tl-notification-email.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MsaCoAuthModule,
    MsaCoInvoiceModule,
    MsaNbClientModule,
    MsaNbOnboardingStatusServiceModule,
    MsaCoDocumentModule,
    MsaTlTemplateGeneratorModule,
    MsaTlNotificationEmailModule,
    HttpModule,
    LoggerModule.forRoot({
      context: `${SERVICE_NAME} - SignContractModule`,
    }),
  ],
  providers: [SignContractResolver, SignContractService],
})
export class SignContractModule {}
