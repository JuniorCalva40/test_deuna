import { ApplicationError } from './application-error';

export class FileGenerationError extends ApplicationError {
  constructor(message: string) {
    super(`Error generating file: ${message}`);
    this.name = 'FileGenerationError';
  }
}

export class FileStorageError extends ApplicationError {
  constructor(message: string) {
    super(`Error storing file: ${message}`);
    this.name = 'FileStorageError';
  }
}
