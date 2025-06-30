import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaCoInvoiceServiceProvider,
  MSA_CO_INVOICE_SERVICE,
} from './providers/msa-co-invoice.provider';
import { FakeMsaCoInvoiceService } from './services/fake-msa-co-invoice.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaCoInvoiceServiceProvider, FakeMsaCoInvoiceService],
  exports: [MSA_CO_INVOICE_SERVICE],
})
export class MsaCoInvoiceModule {}
