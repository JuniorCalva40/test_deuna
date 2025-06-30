import { TemplateGenerationError } from './template-generation-error';
import { ApplicationError } from './application-error';

describe('TemplateGenerationError', () => {
  it('should extend ApplicationError', () => {
    const error = new TemplateGenerationError('Test error');
    expect(error).toBeInstanceOf(ApplicationError);
  });

  it('should format the error message correctly', () => {
    const errorMessage = 'Test error message';
    const error = new TemplateGenerationError(errorMessage);
    expect(error.message).toBe(`Error generating template: ${errorMessage}`);
  });

  it('should set the name property correctly', () => {
    const error = new TemplateGenerationError('Test error');
    expect(error.name).toBe('TemplateGenerationError');
  });

  it('should be catchable as an ApplicationError', () => {
    let caughtError: any;

    expect(() => {
      throw new TemplateGenerationError('Test error');
    }).toThrow();

    try {
      throw new TemplateGenerationError('Test error');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ApplicationError);
  });

  it('should preserve the stack trace', () => {
    const error = new TemplateGenerationError('Test error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('TemplateGenerationError');
  });
});
