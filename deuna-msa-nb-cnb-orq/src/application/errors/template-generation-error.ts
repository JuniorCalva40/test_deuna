import { ApplicationError } from './application-error';

export class TemplateGenerationError extends ApplicationError {
  constructor(message: string) {
    super(`Error generating template: ${message}`);
    this.name = 'TemplateGenerationError';
  }
}
