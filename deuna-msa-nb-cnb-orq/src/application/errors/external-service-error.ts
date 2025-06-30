import { ApplicationError } from './application-error';

export class ExternalServiceError extends ApplicationError {
  readonly errorCode: string;
  readonly details: Record<string, any>;
  readonly endpoint?: string;

  constructor(
    message: string,
    errorCode: string,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message);
    this.errorCode = errorCode;
    this.details = details;
    this.endpoint = endpoint;
  }
}

export class ConnectionRefusedError extends ExternalServiceError {
  constructor(
    message: string,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message, 'CONNECTION_REFUSED', details, endpoint);
  }
}

export class ConnectionTimeoutError extends ExternalServiceError {
  constructor(
    message: string,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message, 'CONNECTION_TIMEOUT', details, endpoint);
  }
}

export class DnsResolutionError extends ExternalServiceError {
  constructor(
    message: string,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message, 'DNS_RESOLUTION_ERROR', details, endpoint);
  }
}

export class HttpResponseError extends ExternalServiceError {
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message, `HTTP_${statusCode}`, details, endpoint);
    this.statusCode = statusCode;
  }
}

export class NoResponseError extends ExternalServiceError {
  constructor(
    message: string,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message, 'NO_RESPONSE', details, endpoint);
  }
}

export class CommunicationError extends ExternalServiceError {
  constructor(
    message: string,
    details: Record<string, any> = {},
    endpoint?: string,
  ) {
    super(message, 'COMMUNICATION_ERROR', details, endpoint);
  }
}

export class InternalServiceError extends ExternalServiceError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 'INTERNAL_ERROR', details);
  }
}
