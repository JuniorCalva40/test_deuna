import { ErrorCodes } from '@deuna/tl-common-nd';

export const errorCodes = {
  [ErrorCodes.MIC_ONB_STATUS_OTP_VERIFY_TWO_REMAINING_ATTEMPT]: 2,
  [ErrorCodes.MIC_ONB_STATUS_OTP_VERIFY_ONE_REMAINING_ATTEMPT]: 1,
  [ErrorCodes.MIC_ONB_STATUS_OTP_VERIFY_ATTEMPTS_EXCEEDED]: 0,
};
