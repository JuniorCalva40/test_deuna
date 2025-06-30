import { Logger } from '@nestjs/common';
import { ApolloError } from 'apollo-server-express';

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
    // Error codes mapping based on context
    const errorMapping: { [key: string]: string } = {
      auth: 'NB_ERR_001',
      onboarding: 'NB_ERR_101',
      client: 'NB_ERR_201',
      document: 'NB_ERR_301',
      contract: 'NB_ERR_401',
      billing: 'NB_ERR_501',
      notification: 'NB_ERR_601',
      system: 'NB_ERR_901',
    };

    // Default to system error if context not found
    const baseCode = errorMapping[context.split('-')[0]] || 'NB_ERR_901';

    return {
      code: error?.code || baseCode,
      message:
        error?.message ||
        `[${context.toUpperCase()}] Error: ${error || 'Unknown error'}`,
      context,
      details: error?.details || error,
    };
  }
}
