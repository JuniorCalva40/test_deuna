import { HttpStatus } from '@nestjs/common';

import { ErrorCodes, GlobalErrorObjectType } from '@deuna/tl-common-nd';
import { SERVICE_NAME } from './common';

export enum MessageCode {
  INVALID_EMAIL = 'InvalidEmailAddress',
  INVALID_STATE = 'InsalidState',
  USER_NOT_FOUND = 'UserNotFound',
  DEFAULT = 'Default',
}

const MESSAGE_ERROR = {
  [MessageCode.INVALID_EMAIL]: 'Invalid email address',
  [MessageCode.USER_NOT_FOUND]: 'User not found',
  [MessageCode.DEFAULT]: 'Internal server error',
  [MessageCode.INVALID_STATE]: 'Invalid email address',
};

export const REASON_ERROR = {
  [MessageCode.INVALID_EMAIL]: 'Invalid email address',
  [MessageCode.USER_NOT_FOUND]: 'User not found',
  [MessageCode.DEFAULT]: 'Internal server error',
};

export const DETAIL_ERROR = {
  [MessageCode.INVALID_EMAIL]: 'Invalid email address',
  [MessageCode.USER_NOT_FOUND]: 'User not found',
  [MessageCode.DEFAULT]: 'Internal server error',
};

export const MESSAGE_VALIDATION: Record<MessageCode, GlobalErrorObjectType> = {
  [MessageCode.INVALID_EMAIL]: {
    message: MESSAGE_ERROR[MessageCode.INVALID_EMAIL],
    statusCode: HttpStatus.BAD_REQUEST,
    errors: [
      {
        reason: REASON_ERROR[MessageCode.INVALID_EMAIL],
        source: SERVICE_NAME,
        code: ErrorCodes.VERIFY_EMAIL_CODE,
        details: DETAIL_ERROR[MessageCode.INVALID_EMAIL],
      },
    ],
  },
  [MessageCode.USER_NOT_FOUND]: {
    message: MESSAGE_ERROR[MessageCode.USER_NOT_FOUND],
    statusCode: HttpStatus.FORBIDDEN,
    errors: [
      {
        reason: REASON_ERROR[MessageCode.USER_NOT_FOUND],
        source: SERVICE_NAME,
        code: ErrorCodes.CONTENT_STORAGE_INVALID_ACCESS,
        details: DETAIL_ERROR[MessageCode.USER_NOT_FOUND],
      },
    ],
  },
  [MessageCode.DEFAULT]: {
    message: MESSAGE_ERROR[MessageCode.DEFAULT],
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errors: [
      {
        reason: REASON_ERROR[MessageCode.DEFAULT],
        source: SERVICE_NAME,
        code: ErrorCodes.CONTENT_STORAGE_DEFAULT,
        details: DETAIL_ERROR[MessageCode.DEFAULT],
      },
    ],
  },
  [MessageCode.INVALID_STATE]: {
    message: MESSAGE_ERROR[MessageCode.DEFAULT],
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errors: [
      {
        reason: REASON_ERROR[MessageCode.DEFAULT],
        source: SERVICE_NAME,
        code: ErrorCodes.CONTENT_STORAGE_DEFAULT,
        details: DETAIL_ERROR[MessageCode.DEFAULT],
      },
    ],
  },
};
