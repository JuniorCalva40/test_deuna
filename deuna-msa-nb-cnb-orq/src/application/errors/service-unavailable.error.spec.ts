import { ServiceUnavailableError } from './service-unavailable.error';
import { ApplicationError } from './application-error';

describe('ServiceUnavailableError', () => {
  it('should be defined', () => {
    const error = new ServiceUnavailableError('Error message', 'TestService');
    expect(error).toBeDefined();
  });

  it('should extend ApplicationError', () => {
    const error = new ServiceUnavailableError('Error message', 'TestService');
    expect(error).toBeInstanceOf(ApplicationError);
  });

  it('should set the error name correctly', () => {
    const error = new ServiceUnavailableError('Error message', 'TestService');
    expect(error.name).toBe('ServiceUnavailableError');
  });

  it('should store the service name', () => {
    const serviceName = 'TestService';
    const error = new ServiceUnavailableError('Error message', serviceName);
    expect(error.service).toBe(serviceName);
  });

  it('should store the error message', () => {
    const errorMessage = 'Service is unavailable';
    const error = new ServiceUnavailableError(errorMessage, 'TestService');
    expect(error.message).toBe(errorMessage);
  });

  it('should store the endpoint when provided', () => {
    const endpoint = '/api/test';
    const error = new ServiceUnavailableError(
      'Error message',
      'TestService',
      endpoint,
    );
    expect(error.endpoint).toBe(endpoint);
  });

  it('should have undefined endpoint when not provided', () => {
    const error = new ServiceUnavailableError('Error message', 'TestService');
    expect(error.endpoint).toBeUndefined();
  });

  it('should be able to create custom error messages with service and endpoint', () => {
    const serviceName = 'TestService';
    const endpoint = '/api/test';
    const error = new ServiceUnavailableError(
      `${serviceName} service is unavailable at ${endpoint}`,
      serviceName,
      endpoint,
    );
    expect(error.message).toBe(
      'TestService service is unavailable at /api/test',
    );
    expect(error.service).toBe(serviceName);
    expect(error.endpoint).toBe(endpoint);
  });
});
