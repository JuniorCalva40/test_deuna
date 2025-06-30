import { Observable } from 'rxjs';
import { ValidateDepositAccountInputDto } from '../dto/validate-deposit-account-input.dto';
import { ValidateDepositAccountResponseDto } from '../dto/validate-deposit-account-response.dto';
import { InitiateCellPhoneDepositResponseDto } from '../dto/initiate-cellphone-deposit-response.dto';
import { InitiateCellPhoneDepositInputDto } from '../dto/initiate-cellphone-deposit-input.dto';
import { GenerateQrInputDto } from '../dto/generate-qr-input.dto';
import { GenerateQrResponseDto } from '../dto/generate-qr-response.dto';
import { ExecuteDepositInputDto } from '../dto/execute-deposit-input.dto';
import { ExecuteDepositResponseDto } from '../dto/execute-deposit-response.dto';
import { ConfirmDepositResponseDto } from '../dto/confirm-deposit-response.dto';
import { ConfirmDepositInputDto } from '../dto/confirm-deposit-input.dto';

export interface IMsaNbOrqTransactionService {
  initiateCellPhoneDeposit(
    input: InitiateCellPhoneDepositInputDto,
  ): Observable<InitiateCellPhoneDepositResponseDto>;

  validateDepositAccount(
    input: ValidateDepositAccountInputDto,
  ): Observable<ValidateDepositAccountResponseDto>;

  generateQr(input: GenerateQrInputDto): Observable<GenerateQrResponseDto>;

  executeDeposit(
    input: ExecuteDepositInputDto,
  ): Observable<ExecuteDepositResponseDto>;

  confirmDeposit(
    input: ConfirmDepositInputDto,
  ): Observable<ConfirmDepositResponseDto>;
}
