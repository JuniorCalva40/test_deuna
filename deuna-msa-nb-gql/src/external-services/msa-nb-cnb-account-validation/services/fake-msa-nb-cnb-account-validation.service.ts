import { Injectable, Logger } from '@nestjs/common';
import { IMsaNbCnbAccountValidationService } from '../interfaces/msa-nb-cnb-account-validation-service.interface';
import {
  CnbAccountValidationRequest,
  CnbAccountValidationResponse,
} from '../interfaces/msa-nb-cnb-account-validation-service.interface';

@Injectable()
export class FakeMsaNbCnbAccountValidationService
  implements IMsaNbCnbAccountValidationService
{
  private readonly logger = new Logger(FakeMsaNbCnbAccountValidationService.name);

  async validateAccount(
    request: CnbAccountValidationRequest,
  ): Promise<CnbAccountValidationResponse> {
    this.logger.log(
      `[FAKE] Validating CNB account: ${request.accountNumber}`,
    );

    // Simular validación de cuenta
    const isActiveAccount = request.accountNumber.startsWith('ACTIVE');
    const hasBalance = request.accountNumber.includes('BALANCE');

    if (!isActiveAccount) {
      throw {
        status: 'error',
        error: {
          code: 'CNB_ACCOUNT_NOT_FOUND',
          message: 'CNB account not found or inactive',
          details: {
            accountNumber: request.accountNumber,
          },
        },
      };
    }

    const mockResponse: CnbAccountValidationResponse = {
      status: 'success',
      data: {
        accountNumber: request.accountNumber,
        accountStatus: hasBalance ? 'active' : 'inactive',
        balance: hasBalance ? 1000.0 : 0.0,
        currency: 'USD',
        isActive: hasBalance,
      },
      message: 'Account validation successful',
    };

    this.logger.log(
      `[FAKE] CNB account validation successful for: ${request.accountNumber}`,
    );

    return mockResponse;
  }
} 