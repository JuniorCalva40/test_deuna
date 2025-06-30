import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ExecuteDepositInput } from '../dto/execute-deposit.dto';
import { ExecuteDepositResponse } from '../dto/execute-deposit.dto';
import { MSA_NB_ORQ_TRANSACTION_SERVICE } from '../../../external-services/msa-nb-orq-transaction/providers/msa-nb-orq-transaction-provider';
import { IMsaNbOrqTransactionService } from '../../../external-services/msa-nb-orq-transaction/interfaces/msa-nb-orq-transaction-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * service responsible for executing a deposit
 */
@Injectable()
export class ExecuteDepositService {
  private readonly logger = new Logger(ExecuteDepositService.name);

  constructor(
    @Inject(MSA_NB_ORQ_TRANSACTION_SERVICE)
    private readonly msaNbOrqTransactionService: IMsaNbOrqTransactionService,
  ) {}

  async executeDeposit(
    input: ExecuteDepositInput,
    deviceId: string,
    sessionId: string,
    ip: string,
    trackingId: string,
  ): Promise<ExecuteDepositResponse> {
    try {
      const executeDepositInput = {
        transactionId: input.transactionId,
        sessionId: sessionId,
        deviceId: deviceId,
        deviceIp: ip,
        trackingId: trackingId,
      };

      this.validateExecuteDepositInput(executeDepositInput);

      const response = await lastValueFrom(
        this.msaNbOrqTransactionService.executeDeposit(executeDepositInput),
      );

      if (!response) {
        this.throwError(
          ErrorCodes.TRANSACTION_SERVICE_ERROR,
          'No response received from transaction service',
        );
      }

      if (response.status === 'FAILED') {
        this.throwError(
          ErrorCodes.TRANSACTION_PROCESS_FAILED,
          'Transaction processing failed',
          response,
        );
      }

      if (response.status === 'ERROR') {
        this.throwError(
          ErrorCodes.TRANSACTION_SERVICE_ERROR,
          response.message,
          response,
        );
      }

      return {
        message: response.message,
        status: response.status,
      };
    } catch (error) {
      return ErrorHandler.handleError(error, 'execute-deposit');
    }
  }

  private throwError(code: string, message: string, details?: any): never {
    throw { code, message, ...(details && { details }) };
  }

  private isValidIpAddress(ip: string): boolean {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  private validateExecuteDepositInput(input: {
    transactionId: string;
    sessionId: string;
    deviceId: string;
    deviceIp: string;
    trackingId: string;
  }): void {
    if (!input.transactionId?.trim()) {
      this.throwError(
        ErrorCodes.TRANSACTION_ID_INVALID,
        'Transaction ID is required',
      );
    }

    if (!input.sessionId?.trim()) {
      this.throwError(
        ErrorCodes.TRANSACTION_SESSION_INVALID,
        'Session ID is required',
      );
    }

    if (!input.deviceId?.trim()) {
      this.throwError(
        ErrorCodes.TRANSACTION_DEVICE_INVALID,
        'Device ID is required',
      );
    }

    if (!input.deviceIp?.trim()) {
      this.throwError(
        ErrorCodes.TRANSACTION_DEVICE_INVALID,
        'Device IP is required',
      );
    }

    if (!this.isValidIpAddress(input.deviceIp)) {
      this.throwError(
        ErrorCodes.TRANSACTION_DEVICE_INVALID,
        'Invalid IP address format',
      );
    }

    if (!input.trackingId?.trim()) {
      this.throwError(
        ErrorCodes.TRANSACTION_ID_INVALID,
        'Tracking ID is required',
      );
    }
  }
}
