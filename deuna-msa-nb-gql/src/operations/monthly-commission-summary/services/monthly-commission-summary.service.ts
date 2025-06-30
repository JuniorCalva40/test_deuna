import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import { MonthlyCommissionSummaryResponse } from '../dto/monthly-commission-summary-response.dto';
import { IMsaTlOpensearchManagerService } from '../../../external-services/msa-tl-opensearch-manager/interfaces/msa-tl-opensearch-manager.interface';
import { MSA_TL_OPENSEARCH_MANAGER_SERVICE } from '../../../external-services/msa-tl-opensearch-manager/providers/msa-tl-opensearch-manager.provider';
import { ErrorHandler } from '../../../utils/error-handler.util';

@Injectable()
export class MonthlyCommissionSummaryService {
  private readonly logger = new Logger(MonthlyCommissionSummaryService.name);
  private readonly CONTEXT = 'monthly-commission-summary';

  constructor(
    @Inject(MSA_TL_OPENSEARCH_MANAGER_SERVICE)
    private readonly opensearchService: IMsaTlOpensearchManagerService,
  ) {}

  async getMonthlyCommissionSummary(
    merchantId: string,
  ): Promise<MonthlyCommissionSummaryResponse> {
    this.logger.log(
      `getMonthlyCommissionSummary - merchantId: ${merchantId}`,
      this.CONTEXT,
    );

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNumber = currentDate.getMonth() + 1;

    const endMonthString = `${currentYear}-${String(
      currentMonthNumber,
    ).padStart(2, '0')}`;

    let startYear = currentYear;
    let startMonthNumber = currentMonthNumber - 1;
    if (startMonthNumber === 0) {
      startMonthNumber = 12;
      startYear -= 1;
    }
    const startMonthString = `${startYear}-${String(startMonthNumber).padStart(
      2,
      '0',
    )}`;

    try {
      const response = await lastValueFrom(
        this.opensearchService.getMonthlyCommissionSummary(
          merchantId,
          startMonthString,
          endMonthString,
        ),
      );

      const filteredAndMappedSummary = response.map((item) => ({
        month: item.month,
        monthlyTotal: item.monthlyTotal,
        monthlyCount: item.monthlyCount,
      }));

      return {
        status: 'SUCCESS',
        summary: filteredAndMappedSummary,
      };
    } catch (error) {
      ErrorHandler.handleError(error, this.CONTEXT);
    }
  }
}
