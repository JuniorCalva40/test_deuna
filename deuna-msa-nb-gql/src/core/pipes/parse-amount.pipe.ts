import { PipeTransform, Injectable } from '@nestjs/common';
import { ErrorHandler } from '../../utils/error-handler.util';
import { PARSE_AMOUNT_METADATA, ParseAmountOptions } from '../decorators/parse-amount.decorator';
import 'reflect-metadata';
import { ErrorCodes } from '../../common/constants/error-codes';

@Injectable()
export class ParseAmountPipe implements PipeTransform {
  transform(value: any): any {
    if (!value || typeof value !== 'object') return value;

    const rawAmount = value.amount;

    // 1. Generic validation: must be a valid number
    const parsed = parseFloat(rawAmount);
    if (!rawAmount || Number.isNaN(parsed)) {
      ErrorHandler.handleError(
        {
          message: `amount must be a valid number`,
          code: ErrorCodes.VALIDATION_FIELD_INVALID_NUMBER,
          details: { field: 'amount', original: rawAmount },
        },
        'parse-amount',
      );
    }

    // 2. Specific validation if decorated with min
    const options: ParseAmountOptions =
      Reflect.getMetadata(PARSE_AMOUNT_METADATA, value, 'amount');

    if (options?.min !== undefined && parsed < options.min) {
      ErrorHandler.handleError(
        {
          message: `Amount must be greater than or equal to ${options.min}`,
          code: ErrorCodes.VALIDATION_FIELD_MIN_VALUE,
          details: { field: 'amount', value: parsed },
        },
        'parse-amount',
      );
    }

    value.amount = parsed;
    return value;
  }
}