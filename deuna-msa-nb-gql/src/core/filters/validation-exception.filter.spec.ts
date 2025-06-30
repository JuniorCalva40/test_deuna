import { ValidationExceptionFilter } from './validation-exception.filter';
import { BadRequestException } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { ErrorHandler } from '../../utils/error-handler.util';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { ErrorCodes } from '../../common/constants/error-codes';

jest.mock('../../utils/error-handler.util');

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;

  beforeEach(() => {
    filter = new ValidationExceptionFilter();
    jest.clearAllMocks();
  });

  const mockArgumentsHost = (fieldName = 'testField'): ArgumentsHost => {
    const gqlArgsHostMock = {
      getInfo: () => ({ fieldName }),
    };

    jest.spyOn(GqlArgumentsHost, 'create').mockReturnValue(gqlArgsHostMock as any);
    return {} as ArgumentsHost;
  };

  it('should handle validation error with multiple messages', () => {
    const messages = ['field1 is required', 'field2 must be a number'];
    const exception = new BadRequestException(messages);
    const host = mockArgumentsHost('customMutation');

    filter.catch(exception, host);

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      {
        message: 'field1 is required | field2 must be a number',
        details: messages,
        code: ErrorCodes.VALIDATION_FIELD_REQUIRED,
      },
      'customMutation',
    );
  });

  it('should handle validation error with single string message', () => {
    const exception = new BadRequestException('simple message');
    const host = mockArgumentsHost('resolverName');

    filter.catch(exception, host);

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      {
        message: 'Bad Request Exception',
        details: ['Bad Request Exception'],
        code: ErrorCodes.VALIDATION_FIELD_REQUIRED,
      },
      'resolverName',
    );
  });

  it('should fallback to default error message if response is undefined', () => {
    const exception = new BadRequestException();
    const host = mockArgumentsHost('someField');

    jest.spyOn(exception, 'getResponse').mockReturnValue(undefined);

    filter.catch(exception, host);

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      {
        message: 'Bad Request Exception',
        details: ['Bad Request Exception'],
        code: ErrorCodes.VALIDATION_FIELD_REQUIRED,
      },
      'someField',
    );
  });
});