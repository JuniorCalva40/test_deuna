import { Module } from '@nestjs/common';
import { InitiateDepositResolver } from './initiate-deposit.resolver';
import { InitiateDepositService } from './services/initiate-deposit.service';
import { MsaNbOrqTransactionServiceModule } from '../../external-services/msa-nb-orq-transaction/msa-nb-orq-transaction-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOrqTransactionServiceModule, HttpModule],
  providers: [InitiateDepositResolver, InitiateDepositService],
})
export class InitiateDepositModule {}
