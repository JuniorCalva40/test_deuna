import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RestMsaTlDigisignInvoiceService } from './services/rest-msa-tl-digisign-invoice.service';
import {
  MSA_TL_DIGISIGN_INVOICE_SERVICE,
  msaTlDigisignInvoiceProvider,
} from './providers/msa-tl-digisign-invoice.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaTlDigisignInvoiceProvider, RestMsaTlDigisignInvoiceService],
  exports: [MSA_TL_DIGISIGN_INVOICE_SERVICE],
})
export class MsaTlDigisignInvoiceModule {}
