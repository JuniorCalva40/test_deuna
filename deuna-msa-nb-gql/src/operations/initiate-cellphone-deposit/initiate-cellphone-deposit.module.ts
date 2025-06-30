import { Module } from '@nestjs/common';
import { InitiateCellPhoneDepositResolver } from './initiate-cellphone-deposit.resolver';
import { InitiateCellPhoneDepositService } from './services/initiate-cellphone-deposit.service';
import { MsaNbOrqTransactionServiceModule } from '../../external-services/msa-nb-orq-transaction/msa-nb-orq-transaction-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbOrqTransactionServiceModule, HttpModule],
  providers: [InitiateCellPhoneDepositResolver, InitiateCellPhoneDepositService],
})
export class InitiateCellPhoneDepositModule {}
