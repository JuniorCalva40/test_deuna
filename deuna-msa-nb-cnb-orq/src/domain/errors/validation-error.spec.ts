import { ValidationError } from './validation-error';

describe('ValidationError', () => {
  it('should create an instance with the correct message', () => {
    const errorMessage = 'Validation failed';
    const error = new ValidationError(errorMessage);

    expect(error.message).toBe(errorMessage);
  });

  it('should have the name "ValidationError"', () => {
    const error = new ValidationError('Error message');

    expect(error.name).toBe('ValidationError');
  });

  it('should be an instance of Error', () => {
    const error = new ValidationError('Error message');

    expect(error).toBeInstanceOf(Error);
  });
});
