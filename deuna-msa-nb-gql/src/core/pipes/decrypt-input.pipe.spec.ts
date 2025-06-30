import { DecryptInputPipe } from './decrypt-input.pipe';
import { decryptData } from '@deuna/tl-encryption-nd';
import { ErrorHandler } from '../../utils/error-handler.util';
import { ErrorCodes } from '../../common/constants/error-codes';

jest.mock('@deuna/tl-encryption-nd', () => ({
  decryptData: jest.fn(),
}));

jest.mock('../../utils/error-handler.util');

describe('DecryptInputPipe', () => {
  const mockDecrypt = decryptData as jest.Mock;
  jest.mock('../../utils/error-handler.util');
  const mockHandleError = ErrorHandler.handleError as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KEY_ID_BUSINESS_APP = 'mock-key-id';
  });

  it('should decrypt specified fields correctly', async () => {
    const input = {
      beneficiaryPhoneNumber: 'encrypted1',
      amount: 'encrypted2',
    };

    mockDecrypt
      .mockResolvedValueOnce('593999999999')
      .mockResolvedValueOnce('123.45');

    const pipe = new DecryptInputPipe(['beneficiaryPhoneNumber', 'amount']);
    const result = await pipe.transform(input);

    expect(mockDecrypt).toHaveBeenCalledTimes(2);
    expect(result.beneficiaryPhoneNumber).toBe('593999999999');
    expect(result.amount).toBe('123.45');
  });

  it('should skip decryption if field is not present', async () => {
    const input = {
      amount: 'encrypted2',
    };

    mockDecrypt.mockResolvedValueOnce('123.45');

    const pipe = new DecryptInputPipe(['beneficiaryPhoneNumber', 'amount']);
    const result = await pipe.transform(input);

    expect(mockDecrypt).toHaveBeenCalledTimes(1);
    expect(result.amount).toBe('123.45');
  });

  it('should call ErrorHandler if KEY_ID_BUSINESS_APP is missing', async () => {
    delete process.env.KEY_ID_BUSINESS_APP;

    const pipe = new DecryptInputPipe(['amount']);
    const input = { amount: 'enc' };

    await pipe.transform(input);

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Missing KEY_ID_BUSINESS_APP',
        code: ErrorCodes.DECRYPTION_ERROR_GENERIC,
      }),
      'decrypt-input',
    );
  });

  it('should call ErrorHandler for InvalidCiphertextException', async () => {
    mockDecrypt.mockRejectedValue({ code: 'InvalidCiphertextException' });

    const pipe = new DecryptInputPipe(['amount']);
    const input = { amount: 'invalid' };

    await pipe.transform(input);

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Failed to decrypt field'),
        code: ErrorCodes.DECRYPTION_FIELD_FAILED,
        details: { field: 'amount', encrypted: 'invalid' },
      }),
      'decrypt-input',
    );
  });

  it('should call ErrorHandler for unexpected errors', async () => {
    const error = new Error('Something bad happened');
    mockDecrypt.mockRejectedValue(error);

    const pipe = new DecryptInputPipe(['amount']);
    const input = { amount: 'bad' };

    await pipe.transform(input);

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Unexpected error during decryption'),
        code: ErrorCodes.DECRYPTION_ERROR_GENERIC,
        details: { field: 'amount', error },
      }),
      'decrypt-input',
    );
  });
});