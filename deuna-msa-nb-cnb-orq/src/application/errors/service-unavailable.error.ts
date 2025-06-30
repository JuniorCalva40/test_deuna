import { ApplicationError } from './application-error';

export class ServiceUnavailableError extends ApplicationError {
  constructor(
    message: string,
    public readonly service: string,
    public readonly endpoint?: string,
  ) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
