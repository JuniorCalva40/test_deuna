import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMsaNbOrqTransactionService } from '../interfaces/msa-nb-orq-transaction-service.interface';
import { InitiateDepositInput } from '../dto/msa-nb-orq-transaction-input.dto';
import { initiateDepositResponseDto } from '../dto/msa-nb-orq-transaction-response.dto';

@Injectable()
export class FakeMsaNbOrqTransactionService
  implements IMsaNbOrqTransactionService
{
    
  initiateDeposit(
    input: InitiateDepositInput,
  ): Observable<initiateDepositResponseDto> {
    // validate the input
    if (!input) {
      throw new Error('InitiateDepositInput is required');
    }

    // simulate succesful response
    const response: initiateDepositResponseDto = {
      accountNumber: 'fake-account-number',
      beneficiaryName: 'fake-beneficiary-name',
      identification: 'fake-identification',
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

