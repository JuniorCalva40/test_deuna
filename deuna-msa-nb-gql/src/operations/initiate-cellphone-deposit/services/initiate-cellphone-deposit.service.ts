import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { lastValueFrom } from 'rxjs';
import { InitiateCellPhoneDepositServiceInput } from '../dto/initiate-cellphone-deposit-input.dto';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { InitiateCellPhoneDepositResponse } from '../dto/initiate-cellphone-deposit-response.dto';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { formatLogger } from '../../../utils/format-logger';

/**
 * Service responsible for initiate cellphone deposit.
 */
@Injectable()
export class InitiateCellPhoneDepositService {
  private readonly logger = new Logger({
    context: InitiateCellPhoneDepositService.name,
  });
  constructor(
    @Inject(MSA_NB_ORQ_TRANSACTION_SERVICE)
    private readonly msaNbOrqTransactionService: IMsaNbOrqTransactionService,
  ) {}

  /**
   * Initiates the initiate cellphone deposit process.
   *
   * @param input - The input for the initiate cellphone deposit process.
   * @returns A promise that resolves to a InitiateCellPhoneDepositResponse.
   */
  async initiateCellPhoneDeposit(
    input: InitiateCellPhoneDepositServiceInput,
  ): Promise<InitiateCellPhoneDepositResponse> {
    try {
      formatLogger(
        this.logger,
        'info',
        `Initiating cellphone deposit for identification: ${input.ordererIdentification} into msa-nb-orq-transaction service`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      const responseInitiateCellPhoneDeposit = await lastValueFrom(
        this.msaNbOrqTransactionService.initiateCellPhoneDeposit(input),
      );

      if (!responseInitiateCellPhoneDeposit) {
        formatLogger(
          this.logger,
          'error',
          `Error initiating cellphone deposit for identification: ${input.ordererIdentification} into msa-nb-orq-transaction service`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        return ErrorHandler.handleError(
          'initiate-cellphone-deposit',
          ErrorCodes.INITIATE_CELLPHONE_DEPOSIT_FAILED,
        );
      }

      if (responseInitiateCellPhoneDeposit.status === 'ERROR') {
        formatLogger(
          this.logger,
          'error',
          `Error initiating cellphone deposit for identification: ${input.ordererIdentification} into msa-nb-orq-transaction service`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        return ErrorHandler.handleError(
          responseInitiateCellPhoneDeposit,
          'initiate-cellphone-deposit',
        );
      }

      return {
        status: responseInitiateCellPhoneDeposit.status,
        message: responseInitiateCellPhoneDeposit.message,
        beneficiaryAccountNumber:
          responseInitiateCellPhoneDeposit.beneficiaryAccountNumber || '',
        beneficiaryName: responseInitiateCellPhoneDeposit.beneficiaryName || '',
        ordererAccountNumber:
          responseInitiateCellPhoneDeposit.ordererAccountNumber || '',
        ordererName: responseInitiateCellPhoneDeposit.ordererName || '',
        transactionId: responseInitiateCellPhoneDeposit.transactionId || '',
      };
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error initiating cellphone deposit for identification: ${input.ordererIdentification} into msa-nb-orq-transaction service`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      return ErrorHandler.handleError(error, 'initiate-cellphone-deposit');
    }
  }
}
