import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMsaCoTransferOrchestrationService } from '../interfaces/msa-co-transfer-orchestration-service.interface';
import { ValidateBalanceInput } from '../dto/msa-co-transfer-orchestration-input.dto';
import { ValidateBalanceResponse } from '../dto/msa-co-transfer-orchestration-response.dto';

@Injectable()
export class FakeMsaCoTransferOrchestrationService
  implements IMsaCoTransferOrchestrationService
{
  validateBalance(
    input: ValidateBalanceInput,
  ): Observable<ValidateBalanceResponse> {
    // validate the input
    if (!input.accountId) {
      throw new Error('ValidateBalanceInput is required');
    }

    // simulate succesful response
    const response: ValidateBalanceResponse = {
      totalBalance: 1000,
      overdraftAmount: 0,
      technicalOverdraftAmount: 0,
      lockedBalance: 0,
      holdBalance: 0,
      availableBalance: 1000,
      overdraftInterestDue: 0,
      technicalOverdraftInterestDue: 0,
      feesDue: 0,
      blockedBalance: 0,
      forwardAvailableBalance: 0,
    };

    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }
}
