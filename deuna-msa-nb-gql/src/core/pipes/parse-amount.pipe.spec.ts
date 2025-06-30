import { ParseAmountPipe } from './parse-amount.pipe';
import { ErrorHandler } from '../../utils/error-handler.util';
import { ErrorCodes } from '../../common/constants/error-codes';
import 'reflect-metadata';
import { PARSE_AMOUNT_METADATA } from '../decorators/parse-amount.decorator';

jest.mock('../../utils/error-handler.util');

describe('ParseAmountPipe', () => {
  const pipe = new ParseAmountPipe();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse a valid numeric string to number', () => {
    const input = { amount: '123.45' };
    const result = pipe.transform({ ...input });
    expect(result.amount).toBe(123.45);
  });

  it('should throw error for undefined amount', () => {
    const input = { amount: undefined };

    pipe.transform({ ...input });
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'amount must be a valid number',
        code: ErrorCodes.VALIDATION_FIELD_INVALID_NUMBER,
        details: { field: 'amount', original: undefined },
      }),
      'parse-amount',
    );
  });

  it('should throw error for null amount', () => {
    const input = { amount: null };

    pipe.transform({ ...input });
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'amount must be a valid number',
        code: ErrorCodes.VALIDATION_FIELD_INVALID_NUMBER,
        details: { field: 'amount', original: null },
      }),
      'parse-amount',
    );
  });

  it('should throw error for empty string amount', () => {
    const input = { amount: '' };

    pipe.transform({ ...input });
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'amount must be a valid number',
        code: ErrorCodes.VALIDATION_FIELD_INVALID_NUMBER,
        details: { field: 'amount', original: '' },
      }),
      'parse-amount',
    );
  });

  it('should throw error for NaN string', () => {
    const input = { amount: 'abc' };

    pipe.transform({ ...input });
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'amount must be a valid number',
        code: ErrorCodes.VALIDATION_FIELD_INVALID_NUMBER,
        details: { field: 'amount', original: 'abc' },
      }),
      'parse-amount',
    );
  });

  it('should validate min constraint using metadata', () => {
    const input = { amount: '0.5' };
    Reflect.defineMetadata(
      PARSE_AMOUNT_METADATA,
      { min: 1 },
      input,
      'amount',
    );

    pipe.transform(input);

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Amount must be greater than or equal to 1',
        code: ErrorCodes.VALIDATION_FIELD_MIN_VALUE,
        details: { field: 'amount', value: 0.5 },
      }),
      'parse-amount',
    );
  });

  it('should pass min constraint validation', () => {
    const input = { amount: '5' };
    Reflect.defineMetadata(
      PARSE_AMOUNT_METADATA,
      { min: 1 },
      input,
      'amount',
    );

    const result = pipe.transform({ ...input });
    expect(result.amount).toBe(5);
    expect(ErrorHandler.handleError).not.toHaveBeenCalled();
  });

  it('should return value as is if not an object', () => {
    const result = pipe.transform('not-an-object');
    expect(result).toBe('not-an-object');
  });
});