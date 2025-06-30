import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaNbOrqTransactionServiceProvider,
  MSA_NB_ORQ_TRANSACTION_SERVICE,
} from './providers/msa-nb-orq-transaction-provider';
import { RestMsaNbOrqTransactionService } from './services/rest-msa-nb-orq-transaction.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaNbOrqTransactionServiceProvider, RestMsaNbOrqTransactionService],
  exports: [MSA_NB_ORQ_TRANSACTION_SERVICE],
})
export class MsaNbOrqTransactionServiceModule {}
