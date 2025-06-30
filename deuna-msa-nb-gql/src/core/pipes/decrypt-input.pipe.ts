import { PipeTransform, Injectable } from '@nestjs/common';
import { get, set } from 'lodash';
import { decryptData } from '@deuna/tl-encryption-nd';
import { ErrorHandler } from '../../utils/error-handler.util';
import { ErrorCodes } from '../../common/constants/error-codes';

export const DECRIPT_INPUT = 'decrypt-input';
@Injectable()
export class DecryptInputPipe implements PipeTransform {
  constructor(private readonly fields: string[]) {}

  async transform<T extends Record<string, any>>(value: T): Promise<T> {
    const keyId = process.env.KEY_ID_BUSINESS_APP;

    if (!keyId) {
      ErrorHandler.handleError(
        {
          message: 'Missing KEY_ID_BUSINESS_APP',
          code: ErrorCodes.DECRYPTION_ERROR_GENERIC,
          details: { envVar: 'KEY_ID_BUSINESS_APP' },
        },
        DECRIPT_INPUT,
      );
    }

    for (const field of this.fields) {
      const encrypted = get(value, field);
      if (!encrypted) continue;

      try {
        const decrypted = await decryptData(encrypted, keyId);
        set(value, field, decrypted);
      } catch (error) {
        const isAwsError =
          error?.code === 'InvalidCiphertextException' ||
          error?.name === 'InvalidCiphertextException';

        if (isAwsError) {
          ErrorHandler.handleError(
            {
              message: `Failed to decrypt field '${field}'. Possibly invalid ciphertext or wrong key.`,
              code: ErrorCodes.DECRYPTION_FIELD_FAILED,
              details: { field, encrypted },
            },
            DECRIPT_INPUT,
          );
        }

        ErrorHandler.handleError(
          {
            message: `Unexpected error during decryption of '${field}': ${error?.message || 'Unknown error'}`,
            code: ErrorCodes.DECRYPTION_ERROR_GENERIC,
            details: { field, error },
          },
          DECRIPT_INPUT,
        );
      }
    }

    return value;
  }
}