import { Module } from '@nestjs/common';
import { ValidateDepositAccountResolver } from './validate-deposit-account.resolver';
import { ValidateDepositAccountService } from './services/validate-deposit-account.service';
import { MsaNbOrqTransactionServiceModule } from '../../external-services/msa-nb-orq-transaction/msa-nb-orq-transaction-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOrqTransactionServiceModule, HttpModule],
  providers: [ValidateDepositAccountResolver, ValidateDepositAccountService],
})
export class ValidateDepositAccountModule {}
