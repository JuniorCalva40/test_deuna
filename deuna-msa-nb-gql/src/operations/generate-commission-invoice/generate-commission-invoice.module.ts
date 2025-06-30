import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GenerateCommissionInvoiceResolver } from './generate-commission-invoice.resolver';
import { GenerateCommissionInvoiceService } from './service/generate-commission-invoice.service';
import { MsaTlDigisignInvoiceModule } from '../../external-services/msa-tl-digisign-invoice/msa-tl-digisign-invoice.module';
import { MsaMcCrCommissionsModule } from '../../external-services/deuna-msa-mc-cr-commissions/deuna-msa-mc-cr-commissions.module';
import { MsaBoMcClientModule } from '../../external-services/msa-mc-bo-client/msa-mc-bo-client.service.module';
import { MsaMcBoHierarchyModule } from '../../external-services/msa-mc-bo-hierarchy/msa-mc-bo-hierarchy.module';
import { DeunaMsaMcBoConfigurationModule } from '../../external-services/msa-mc-bo-configuration/deuna-msa-mc-bo-configuration.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MsaTlDigisignInvoiceModule,
    MsaMcCrCommissionsModule,
    MsaBoMcClientModule,
    MsaMcBoHierarchyModule,
    DeunaMsaMcBoConfigurationModule,
  ],
  providers: [
    GenerateCommissionInvoiceResolver,
    GenerateCommissionInvoiceService,
  ],
})
export class GenerateCommissionInvoiceModule {}
