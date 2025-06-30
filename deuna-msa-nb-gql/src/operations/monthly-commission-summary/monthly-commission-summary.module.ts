import { Module } from '@nestjs/common';
import { MonthlyCommissionSummaryService } from './services/monthly-commission-summary.service';
import { MonthlyCommissionSummaryResolver } from './monthly-commission-summary.resolver';
import { MsaTlOpensearchManagerModule } from '../../external-services/msa-tl-opensearch-manager/msa-tl-opensearch-manager.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaTlOpensearchManagerModule, HttpModule],
  providers: [
    MonthlyCommissionSummaryService,
    MonthlyCommissionSummaryResolver,
  ],
})
export class MonthlyCommissionSummaryModule {}
