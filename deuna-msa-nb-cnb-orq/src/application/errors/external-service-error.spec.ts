import {
  CommunicationError,
  ConnectionRefusedError,
  ConnectionTimeoutError,
  DnsResolutionError,
  ExternalServiceError,
  HttpResponseError,
  InternalServiceError,
  NoResponseError,
} from './external-service-error';

describe('ExternalServiceError', () => {
  it('Should create an instance correctly with all parameters', () => {
    const message = 'External service error';
    const errorCode = 'TEST_ERROR';
    const details = { service: 'TestService' };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new ExternalServiceError(
      message,
      errorCode,
      details,
      endpoint,
    );

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe(errorCode);
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should create an instance with empty details by default', () => {
    const message = 'External service error';
    const errorCode = 'TEST_ERROR';
    const endpoint = 'https://api.test.com/endpoint';

    const error = new ExternalServiceError(
      message,
      errorCode,
      undefined,
      endpoint,
    );

    expect(error.details).toEqual({});
  });

  it('Should create an instance with optional endpoint', () => {
    const message = 'External service error';
    const errorCode = 'TEST_ERROR';
    const details = { service: 'TestService' };

    const error = new ExternalServiceError(message, errorCode, details);

    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with both details and endpoint missing', () => {
    const message = 'External service error';
    const errorCode = 'TEST_ERROR';

    const error = new ExternalServiceError(message, errorCode);

    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null details and endpoint', () => {
    const message = 'External service error';
    const errorCode = 'TEST_ERROR';

    const error = new ExternalServiceError(message, errorCode, null, null);

    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('ConnectionRefusedError', () => {
  it('Should create an instance with the correct error code', () => {
    const message = 'Conexión rechazada';
    const details = { service: 'TestService' };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new ConnectionRefusedError(message, details, endpoint);

    expect(error).toBeInstanceOf(ConnectionRefusedError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('CONNECTION_REFUSED');
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should create an instance with minimum parameters', () => {
    const message = 'Conexión rechazada';
    const error = new ConnectionRefusedError(message);

    expect(error.errorCode).toBe('CONNECTION_REFUSED');
    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null parameters', () => {
    const message = 'Conexión rechazada';
    const error = new ConnectionRefusedError(message, null, null);

    expect(error.errorCode).toBe('CONNECTION_REFUSED');
    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('ConnectionTimeoutError', () => {
  it('Should create an instance with the correct error code', () => {
    const message = 'Tiempo de espera agotado';
    const details = { timeout: 5000 };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new ConnectionTimeoutError(message, details, endpoint);

    expect(error).toBeInstanceOf(ConnectionTimeoutError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('CONNECTION_TIMEOUT');
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should create an instance with minimum parameters', () => {
    const message = 'Tiempo de espera agotado';
    const error = new ConnectionTimeoutError(message);

    expect(error.errorCode).toBe('CONNECTION_TIMEOUT');
    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null parameters', () => {
    const message = 'Tiempo de espera agotado';
    const error = new ConnectionTimeoutError(message, null, null);

    expect(error.errorCode).toBe('CONNECTION_TIMEOUT');
    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('DnsResolutionError', () => {
  it('Should create an instance with the correct error code', () => {
    const message = 'Error de resolución DNS';
    const details = { host: 'api.test.com' };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new DnsResolutionError(message, details, endpoint);

    expect(error).toBeInstanceOf(DnsResolutionError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('DNS_RESOLUTION_ERROR');
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should create an instance with minimum parameters', () => {
    const message = 'Error de resolución DNS';
    const error = new DnsResolutionError(message);

    expect(error.errorCode).toBe('DNS_RESOLUTION_ERROR');
    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null parameters', () => {
    const message = 'Error de resolución DNS';
    const error = new DnsResolutionError(message, null, null);

    expect(error.errorCode).toBe('DNS_RESOLUTION_ERROR');
    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('HttpResponseError', () => {
  it('Should create an instance with the HTTP error code and statusCode', () => {
    const message = 'HTTP error';
    const statusCode = 404;
    const details = { path: '/missing-resource' };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new HttpResponseError(message, statusCode, details, endpoint);

    expect(error).toBeInstanceOf(HttpResponseError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe(`HTTP_${statusCode}`);
    expect(error.statusCode).toBe(statusCode);
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should handle different HTTP status codes', () => {
    const statusCodes = [400, 401, 403, 404, 500, 502, 503];
    for (const statusCode of statusCodes) {
      const error = new HttpResponseError('HTTP error', statusCode);
      expect(error.errorCode).toBe(`HTTP_${statusCode}`);
      expect(error.statusCode).toBe(statusCode);
    }
  });

  it('Should create an instance with minimum parameters', () => {
    const message = 'HTTP error';
    const statusCode = 400;

    const error = new HttpResponseError(message, statusCode);

    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.errorCode).toBe(`HTTP_${statusCode}`);
    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null parameters', () => {
    const message = 'HTTP error';
    const statusCode = 400;

    const error = new HttpResponseError(message, statusCode, null, null);

    expect(error.statusCode).toBe(statusCode);
    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('NoResponseError', () => {
  it('Should create an instance with the correct error code', () => {
    const message = 'No se recibió respuesta';
    const details = { timeout: true };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new NoResponseError(message, details, endpoint);

    expect(error).toBeInstanceOf(NoResponseError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('NO_RESPONSE');
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should create an instance with minimum parameters', () => {
    const message = 'No se recibió respuesta';
    const error = new NoResponseError(message);

    expect(error.errorCode).toBe('NO_RESPONSE');
    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null parameters', () => {
    const message = 'No se recibió respuesta';
    const error = new NoResponseError(message, null, null);

    expect(error.errorCode).toBe('NO_RESPONSE');
    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('CommunicationError', () => {
  it('Should create an instance with the correct error code', () => {
    const message = 'Communication error';
    const details = { network: 'disconnected' };
    const endpoint = 'https://api.test.com/endpoint';

    const error = new CommunicationError(message, details, endpoint);

    expect(error).toBeInstanceOf(CommunicationError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('COMMUNICATION_ERROR');
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBe(endpoint);
  });

  it('Should create an instance with minimum parameters', () => {
    const message = 'Communication error';
    const error = new CommunicationError(message);

    expect(error.errorCode).toBe('COMMUNICATION_ERROR');
    expect(error.details).toEqual({});
    expect(error.endpoint).toBeUndefined();
  });

  it('Should create an instance with null parameters', () => {
    const message = 'Communication error';
    const error = new CommunicationError(message, null, null);

    expect(error.errorCode).toBe('COMMUNICATION_ERROR');
    expect(error.details).toBeNull();
    expect(error.endpoint).toBeNull();
  });
});

describe('InternalServiceError', () => {
  it('Should create an instance with the correct error code', () => {
    const message = 'Internal service error';
    const details = { component: 'processor' };

    const error = new InternalServiceError(message, details);

    expect(error).toBeInstanceOf(InternalServiceError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('INTERNAL_ERROR');
    expect(error.details).toEqual(details);
    expect(error.endpoint).toBeUndefined(); // InternalServiceError no acepta endpoint
  });

  it('Should create an instance without details', () => {
    const message = 'Internal service error';

    const error = new InternalServiceError(message);

    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('INTERNAL_ERROR');
    expect(error.details).toEqual({});
  });

  it('Should create an instance with null details', () => {
    const message = 'Internal service error';

    const error = new InternalServiceError(message, null);

    expect(error.message).toBe(message);
    expect(error.errorCode).toBe('INTERNAL_ERROR');
    expect(error.details).toBeNull();
  });
});
