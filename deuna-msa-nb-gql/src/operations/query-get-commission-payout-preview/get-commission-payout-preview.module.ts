import { Module } from '@nestjs/common';
import { GetCommissionPayoutPreviewResolver } from './query-get-commission-payout-preview.resolver';
import { GetCommissionPayoutPreviewService } from './service/query-get-commission-payout-preview.service';
import { MsaTlDigisignInvoiceModule } from '../../external-services/msa-tl-digisign-invoice/msa-tl-digisign-invoice.module';
import { MsaMcCrCommissionsModule } from '../../external-services/deuna-msa-mc-cr-commissions/deuna-msa-mc-cr-commissions.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MsaTlDigisignInvoiceModule,
    MsaMcCrCommissionsModule,
    HttpModule,
    ConfigModule,
  ],
  providers: [
    GetCommissionPayoutPreviewResolver,
    GetCommissionPayoutPreviewService,
  ],
})
export class GetCommissionPayoutPreviewModule {}
