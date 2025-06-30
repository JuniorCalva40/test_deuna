import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IMsaNbOrqTransactionService } from '../interfaces/msa-nb-orq-transaction-service.interface';
import { ValidateDepositAccountInputDto } from '../dto/validate-deposit-account-input.dto';
import { ValidateDepositAccountResponseDto } from '../dto/validate-deposit-account-response.dto';
import { InitiateCellPhoneDepositResponseDto } from '../dto/initiate-cellphone-deposit-response.dto';
import { InitiateCellPhoneDepositInputDto } from '../dto/initiate-cellphone-deposit-input.dto';
import { GenerateQrResponseDto } from '../dto/generate-qr-response.dto';
import { GenerateQrInputDto } from '../dto/generate-qr-input.dto';
import { ConfirmDepositInputDto } from '../dto/confirm-deposit-input.dto';
import { ConfirmDepositResponseDto } from '../dto/confirm-deposit-response.dto';

@Injectable()
export class FakeMsaNbOrqTransactionService
  implements IMsaNbOrqTransactionService
{
  
  validateDepositAccount(
    input: ValidateDepositAccountInputDto,
  ): Observable<ValidateDepositAccountResponseDto> {
    // validate the input
    if (!input) {
      throw new Error('ValidateDepositAccountInputDto is required');
    }

    // simulate succesful response
    const response: ValidateDepositAccountResponseDto = {
      status: 'success',
      message: 'description',
      beneficiaryAccountNumber: 'fake-account-number',
      beneficiaryName: 'fake-beneficiaryName',
    };

    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }

  initiateCellPhoneDeposit(
    input: InitiateCellPhoneDepositInputDto,
  ): Observable<InitiateCellPhoneDepositResponseDto> {
    // validate the input
    if (!input) {
      throw new Error('InitiateCellPhoneDepositInputDto is required');
    }

    // simulate succesful response
    const response: InitiateCellPhoneDepositResponseDto = {
      status: 'success',
      message: 'description',
      beneficiaryAccountNumber: 'fake-account-number',
      ordererAccountNumber: 'fake-beneficiary-name',
      trackingId: 'fake-trackingId',
      transactionId: 'fake-transactionId',
      beneficiaryName: 'fake-beneficiaryName',
      ordererName: 'fake-ordererName',
    };

    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }

  generateQr(input: GenerateQrInputDto): Observable<GenerateQrResponseDto> {
    if (!input) {
      throw new Error('GenerateQrInputDto is required');
    }

    const response: GenerateQrResponseDto = {
      status: 'success',
      message: 'QR generated successfully',
      data: {
        qrUrl: 'https://pagar.deuna.app/H92p/merchant?id=FAKEID123',
        qrBase64: 'data:image/png;base64,FAKE_BASE64_STRING',
        transactionId: 'fake-transaction-id-123',
      },
    };

    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }

  executeDeposit(input: any): Observable<any> {
    if (!input) {
      throw new Error('Input is required');
    }

    const response = {
      status: 'success',
      message: 'Deposit executed successfully',
    };

    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();
      return { unsubscribe() {} };
    });
  }

  confirmDeposit(
    input: ConfirmDepositInputDto,
  ): Observable<ConfirmDepositResponseDto> {
    // validate the input
    if (!input) {
      throw new Error('ConfirmDepositInputDto is required');
    }

    // simulate succesful response
    const response: ConfirmDepositResponseDto = {
      status: 'success',
      message: 'description',
      transactionNumber: 'fake-transaction-number',
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
