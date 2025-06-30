import { Module } from '@nestjs/common';
import { ConfirmDepositResolver } from './confirm-deposit.resolver';
import { ConfirmDepositService } from './services/confirm-deposit.service';
import { MsaNbOrqTransactionServiceModule } from '../../external-services/msa-nb-orq-transaction/msa-nb-orq-transaction-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOrqTransactionServiceModule, HttpModule],
  providers: [ConfirmDepositResolver, ConfirmDepositService],
})
export class ConfirmDepositModule {}
