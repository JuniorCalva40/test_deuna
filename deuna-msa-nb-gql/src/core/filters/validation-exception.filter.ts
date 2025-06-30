import {
    Catch,
    ExceptionFilter,
    ArgumentsHost,
    BadRequestException,
  } from '@nestjs/common';
  import { GqlArgumentsHost } from '@nestjs/graphql';
  import { ErrorHandler } from '../../utils/error-handler.util';
  import { ErrorCodes } from '../../common/constants/error-codes';
  
  @Catch(BadRequestException)
  export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
      const gqlHost = GqlArgumentsHost.create(host);
      const context = gqlHost.getInfo().fieldName;
  
      const response: any = exception.getResponse();
  
      const messages =
        Array.isArray(response?.message) && response.message.length > 0
          ? response.message
          : ['Bad Request Exception'];
  
      const error = new Error(messages.join(' | '));
  
      ErrorHandler.handleError(
        {
          message: error.message,
          details: messages,
          code: ErrorCodes.VALIDATION_FIELD_REQUIRED,
        },
        context,
      );
    }
  }