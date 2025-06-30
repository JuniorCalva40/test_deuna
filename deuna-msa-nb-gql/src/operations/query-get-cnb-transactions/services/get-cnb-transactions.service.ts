import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetCnbTransactionsInput } from '../dto/get-cnb-transactions-input.dto';
import { GetCnbTransactionsResponse } from '../dto/get-cnb-transactions-response.dto';

import { lastValueFrom } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { IMsaTlOpensearchManagerService } from '../../../external-services/msa-tl-opensearch-manager/interfaces/msa-tl-opensearch-manager.interface';
import { MSA_TL_OPENSEARCH_MANAGER_SERVICE } from '../../../external-services/msa-tl-opensearch-manager/providers/msa-tl-opensearch-manager.provider';
import { GetCnbTransactionsResponseDto } from '../../../external-services/msa-tl-opensearch-manager/dto/get-transactions-reponse.dto';
import {
  TransactionChannelId,
  TransactionChannelType,
} from '../../../common/constants/common';

@Injectable()
export class GetCnbTransactionsService {
  private readonly logger = new Logger(GetCnbTransactionsService.name);
  private readonly CONTEXT = 'get-cnb-transactions';

  constructor(
    @Inject(MSA_TL_OPENSEARCH_MANAGER_SERVICE)
    private opensearchService: IMsaTlOpensearchManagerService,
  ) {}

  async getCnbTransactions(
    input: GetCnbTransactionsInput,
    merchantId: string,
  ): Promise<GetCnbTransactionsResponse> {
    this.logger.log(
      `getCnbTransactions - merchantId: ${merchantId}`,
      this.CONTEXT,
    );

    try {
      const response = await lastValueFrom(
        this.opensearchService.getCnbTransactions(input, merchantId),
      );
      return this.transactionMapper(response);
    } catch (error) {
      ErrorHandler.handleError(error, this.CONTEXT);
    }
  }

  private transactionMapper(
    data: GetCnbTransactionsResponseDto,
  ): GetCnbTransactionsResponse {
    return {
      ...data,
      status: 'SUCCESS',
      transactions: data.transactions.map((transaction) => ({
        ...transaction,
        type:
          transaction.transactionChannelId ===
          TransactionChannelId.INTTRANFERDEPOSITOCNBS
            ? TransactionChannelType.DEPOSIT
            : TransactionChannelType.WITHDRAWAL,
      })),
    };
  }
}
