import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { InitiateDepositInput } from '../dto/initiate-deposit-input.dto';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { InitiateDepositResponse } from '../dto/initiate-deposit-response.dto';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';

/**
 * Service responsible for initiate deposit.
 */
@Injectable()
export class InitiateDepositService {
  constructor(
    @Inject(MSA_NB_ORQ_TRANSACTION_SERVICE)
    private readonly msaNbOrqTransactionService: IMsaNbOrqTransactionService,
  ) {}

  /**
   * Initiates the initiate deposit process.
   *
   * @param input - The input for the initiate deposit process.
   * @returns A promise that resolves to a InitiateDepositResponse.
   */
  async initiateDeposit(
    input: InitiateDepositInput,
  ): Promise<InitiateDepositResponse> {
    try {
      const responseInitiateDeposit = await lastValueFrom(
        this.msaNbOrqTransactionService.initiateDeposit(input),
      );

      if (!responseInitiateDeposit) {
        return ErrorHandler.handleError(
          responseInitiateDeposit,
          'initiate-deposit',
        );
      }
      const response: InitiateDepositResponse = {
        ...responseInitiateDeposit,
        status: 'SUCCESS',
      };

      return response;
    } catch (error) {
      return ErrorHandler.handleError(error, 'initiate-deposit');
    }
  }
}

