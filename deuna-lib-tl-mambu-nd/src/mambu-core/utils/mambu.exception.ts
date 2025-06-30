import { MambuError } from '../mambu.types';

export class MambuException extends Error {
  error: MambuError;

  constructor(code: number, message: string, reason: string) {
    super(`code: ${code}, message: ${message}, reason: ${reason}`);
    this.error = {
      errorCode: code,
      errorSource: message,
      errorReason: reason,
    };
    Object.setPrototypeOf(this, MambuException.prototype);
  }
}
