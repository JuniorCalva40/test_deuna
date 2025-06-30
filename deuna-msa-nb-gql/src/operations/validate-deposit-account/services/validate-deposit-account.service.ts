import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ValidateDepositAccountServiceInput } from '../dto/validate-deposit-account-input.dto';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { ValidateDepositAccountResponse } from '../dto/validate-deposit-account-response.dto';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
/**
 * Service responsible for validate deposit account.
 */
@Injectable()
export class ValidateDepositAccountService {
  constructor(
    @Inject(MSA_NB_ORQ_TRANSACTION_SERVICE)
    private readonly msaNbOrqTransactionService: IMsaNbOrqTransactionService,
  ) {}

  /**
   * Initiates the validate deposit account process.
   *
   * @param input - The input for the validate deposit account process.
   * @returns A promise that resolves to a ValidateDepositAccountResponse.
   */
  async validateDepositAccount(
    input: ValidateDepositAccountServiceInput,
  ): Promise<ValidateDepositAccountResponse> {
    try {

      const responseValidateDepositAccount = await lastValueFrom(
        this.msaNbOrqTransactionService.validateDepositAccount(input),
      );

      if (!responseValidateDepositAccount) {
        return ErrorHandler.handleError(
          'validate-deposit-account',
          ErrorCodes.VALIDATE_DEPOSIT_ACCOUNT_FAILED,
        );
      }

      if (responseValidateDepositAccount.status === 'ERROR') {
        return ErrorHandler.handleError(
          responseValidateDepositAccount,
          'validate-deposit-account',
        );
      }
      
      const response: ValidateDepositAccountResponse = {
        status: responseValidateDepositAccount.status,
        message: responseValidateDepositAccount.message,
        beneficiaryAccountNumber:
          responseValidateDepositAccount.beneficiaryAccountNumber,
        beneficiaryName: responseValidateDepositAccount.beneficiaryName,
      };

      return response;
    } catch (error) {
      return ErrorHandler.handleError(error, 'validate-deposit-account');
    }
  }
}
