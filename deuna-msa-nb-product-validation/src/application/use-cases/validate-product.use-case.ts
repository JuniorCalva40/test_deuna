import { Injectable, Inject, Logger } from '@nestjs/common';
import { ProductValidationRequestDto } from '../dto/product-validation.dto';
import {
  ValidationResult,
  ValidationErrorCode,
} from '../../domain/entities/validation-result.entity';
import { MAMBU_CLIENT_PORT } from '../../domain/constants/injection.constants';
import { MambuClientPort } from '../ports/out/clients/mambu.client.port';
import { ValidationType } from 'src/domain/port/product-validation.port';

@Injectable()
export class ValidateProductUseCase {
  private readonly logger = new Logger(ValidateProductUseCase.name);

  constructor(
    @Inject(MAMBU_CLIENT_PORT)
    private readonly mambuClient: MambuClientPort,
  ) {}

  async execute(
    request: ProductValidationRequestDto,
  ): Promise<ValidationResult> {
    const { accountNumber, amount, validationType } = request;

    this.logger.log(
      `UseCase - Starting product validation for account: ${accountNumber}, amount: ${amount || 'N/A'}, type: ${validationType}`,
    );

    try {
      const account = await this.mambuClient.getAccountByNumber(accountNumber);

      console.log('Account fetched:', account);

      const errors: any[] = [];
      let isValid = true;

      // Validar estado de la cuenta (siempre se valida)
      if (account.status !== 'ACTIVE') {
        errors.push({
          code: ValidationErrorCode.ACCOUNT_INACTIVE,
          message: `Account is not active. Current status: ${account.status}`,
          field: 'accountStatus',
        });
        isValid = false;
      }

      // Validar saldo solo si se requiere y se proporciona amount
      if (
        validationType === ValidationType.BALANCE_AND_STATUS &&
        amount !== undefined
      ) {
        if (account.availableBalance < amount) {
          errors.push({
            code: ValidationErrorCode.INSUFFICIENT_BALANCE,
            message: `Insufficient balance. Available: ${account.availableBalance}, Requested: ${amount}`,
            field: 'amount',
          });
          isValid = false;
        }
      }

      this.logger.log(
        `UseCase - Product validation completed. Valid: ${isValid}, Errors: ${errors.length}`,
      );

      return {
        isValid,
        errors,
        accountId: account.id,
        accountNumber: account.accountNumber,
        availableBalance: account.availableBalance,
        requestedAmount: amount,
        accountStatus: account.status,
      };
    } catch (error) {
      this.logger.error(
        `UseCase - Error in product validation: ${error.message}`,
      );
      throw error;
    }
  }
}
