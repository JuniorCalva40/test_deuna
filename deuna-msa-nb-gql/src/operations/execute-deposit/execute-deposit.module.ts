import { Module } from '@nestjs/common';
import { ExecuteDepositResolver } from './execute-deposit.resolver';
import { ExecuteDepositService } from './service/execute-deposit.service';
import { MsaNbOrqTransactionServiceModule } from '../../external-services/msa-nb-orq-transaction/msa-nb-orq-transaction-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOrqTransactionServiceModule, HttpModule],
  providers: [ExecuteDepositResolver, ExecuteDepositService],
})
export class ExecuteDepositModule {}
