import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfirmDepositServiceInput } from '../dto/confirm-deposit-input.dto';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { ConfirmDepositResponse } from '../dto/confirm-deposit-response.dto';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
/**
 * Service responsible for confirm deposit.
 */
@Injectable()
export class ConfirmDepositService {
  constructor(
    @Inject(MSA_NB_ORQ_TRANSACTION_SERVICE)
    private readonly msaNbOrqTransactionService: IMsaNbOrqTransactionService,
  ) {}

  /**
   * Initiates the confirm deposit process.
   *
   * @param input - The input for the confirm deposit process.
   * @returns A promise that resolves to a ConfirmDepositResponse.
   */
  async confirmDeposit(
    input: ConfirmDepositServiceInput,
  ): Promise<ConfirmDepositResponse> {
    try {

      const responseConfirmDeposit = await lastValueFrom(
        this.msaNbOrqTransactionService.confirmDeposit(input),
      );

      if (!responseConfirmDeposit) {
        return ErrorHandler.handleError(
          'confirm-deposit',
          ErrorCodes.INITIATE_CONFIRM_DEPOSIT_FAILED,
        );
      }

      if (responseConfirmDeposit.status === 'ERROR') {
        return ErrorHandler.handleError(
          responseConfirmDeposit,
          'confirm-deposit',
        );
      }

      const response: ConfirmDepositResponse = {
        status: responseConfirmDeposit.status,
        message: responseConfirmDeposit.message,
        transactionNumber: responseConfirmDeposit.transactionNumber || '',
        transactionDate: responseConfirmDeposit.transactionDate || '',
      };

      return response;
    } catch (error) {
      return ErrorHandler.handleError(error, 'confirm-deposit');
    }
  }
}
