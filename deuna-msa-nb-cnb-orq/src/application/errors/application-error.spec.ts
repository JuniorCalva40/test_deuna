import { ApplicationError } from './application-error';

// Clase concreta para probar la clase abstracta
class TestError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}

describe('ApplicationError', () => {
  it('should set error message correctly', () => {
    const errorMessage = 'Test error message';
    const error = new TestError(errorMessage);

    expect(error.message).toBe(errorMessage);
  });

  it('should set error name to the class name', () => {
    const error = new TestError('Test message');

    expect(error.name).toBe('TestError');
  });

  it('should be instance of Error', () => {
    const error = new TestError('Test message');

    expect(error).toBeInstanceOf(Error);
  });

  it('should be instance of ApplicationError', () => {
    const error = new TestError('Test message');

    expect(error).toBeInstanceOf(ApplicationError);
  });
});
