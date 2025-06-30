import { Module } from '@nestjs/common';
import { GetCnbTransactionsService } from './services/get-cnb-transactions.service';

import { HttpModule } from '@nestjs/axios';
import { GetCnbTransactionsResolver } from './get-cnb-transactions.resolver';
import { MsaTlOpensearchManagerModule } from '../../external-services/msa-tl-opensearch-manager/msa-tl-opensearch-manager.module';

@Module({
  imports: [MsaTlOpensearchManagerModule, HttpModule],
  providers: [GetCnbTransactionsService, GetCnbTransactionsResolver],
})
export class GetCnbTransactionsModule {}
