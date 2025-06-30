import { Logger } from '@nestjs/common';
import { ApolloError } from 'apollo-server-express';
import { ErrorCodes } from '../common/constants/error-codes';

interface ErrorResponse {
  code: string;
  message: string;
  context?: string;
  details?: any;
}

export class ErrorHandler {
  private static readonly logger = new Logger(ErrorHandler.name);

  public static handleError(error: any, context: string): never {
    const errorResponse = this.buildErrorResponse(error, context);

    this.logger.error(`[${errorResponse.code}] ${errorResponse.message}`, {
      error_code: errorResponse.code,
      context: errorResponse.context,
      details: errorResponse.details,
      stack: error?.stack,
    });

    throw new ApolloError(errorResponse.message, errorResponse.code, {
      errorResponse: {
        status: 'ERROR',
        errors: [
          {
            code: errorResponse.code,
            message: errorResponse.message,
            context: errorResponse.context,
          },
        ],
      },
    });
  }

  private static buildErrorResponse(
    error: any,
    context: string,
  ): ErrorResponse {
    // If the error already has a code and is in the ErrorCodes enum, we use it directly
    if (error?.code && Object.values(ErrorCodes).includes(error.code)) {
      return {
        code: error.code,
        message: error.message,
        context,
        details: error.details,
      };
    }

    // if the error message is in the map, we use the corresponding error code
    if (error?.message) {
      const messageToErrorCode = new Map([
        ['Username is required', ErrorCodes.CLIENT_DATA_MISSING],
        ['User not found', ErrorCodes.CNB_USER_NOT_FOUND],
        ['Client not found', ErrorCodes.CNB_CLIENT_NOT_FOUND],
        ['Client not precalified', ErrorCodes.CNB_NOT_PRECALIFIED],
        ['Invalid client status', ErrorCodes.CNB_INVALID_STATUS],
        ['Error fetching user data', ErrorCodes.CNB_SERVICE_ERROR],
        ['Error fetching client data', ErrorCodes.CNB_SERVICE_ERROR],
        ['Invalid OTP', ErrorCodes.AUTH_OTP_VALIDATION_FAILED],
        ['Invalid OTP request', ErrorCodes.AUTH_OTP_REQUEST_INVALID],
        ['Failed to update OTP status', ErrorCodes.AUTH_OTP_UPDATE_FAILED],
        ['Invalid transaction amount', ErrorCodes.TRANSACTION_AMOUNT_INVALID],
        ['Transaction ID is required', ErrorCodes.TRANSACTION_ID_INVALID],
        ['Invalid session ID', ErrorCodes.TRANSACTION_SESSION_INVALID],
        ['Invalid device ID', ErrorCodes.TRANSACTION_DEVICE_INVALID],
        [
          'Transaction processing failed',
          ErrorCodes.TRANSACTION_PROCESS_FAILED,
        ],
        ['Transaction service error', ErrorCodes.TRANSACTION_SERVICE_ERROR],
      ]);

      const errorCode = messageToErrorCode.get(error.message);
      if (errorCode) {
        return {
          code: errorCode,
          message: error.message,
          context,
          details: error.details,
        };
      }
    }

    // For unmapped errors, we use a code based on the context
    const contextToErrorCode = new Map([
      ['auth', ErrorCodes.AUTH_TOKEN_INVALID],
      ['onboarding', ErrorCodes.ONB_STATUS_INVALID],
      ['client', ErrorCodes.CLIENT_DATA_MISSING],
      ['document', ErrorCodes.DOC_FORMAT_INVALID],
      ['contract', ErrorCodes.CONTRACT_DATA_INVALID],
      ['billing', ErrorCodes.BILL_PROCESS_FAILED],
      ['notification', ErrorCodes.NOTIF_SEND_FAILED],
      ['validate-cnb-state', ErrorCodes.CNB_SERVICE_ERROR],
      ['calification', ErrorCodes.CALIFICATION_SERVICE_ERROR],
      ['execute-deposit', ErrorCodes.TRANSACTION_SERVICE_ERROR],
    ]);

    const baseContext = context.split('-')[0];
    const defaultCode =
      contextToErrorCode.get(baseContext) || ErrorCodes.SYS_ERROR_UNKNOWN;

    return {
      code: defaultCode,
      message:
        error?.message ||
        `[${context.toUpperCase()}] Error: ${error || 'Unknown error'}`,
      context,
      details: error?.details || error,
    };
  }
}
