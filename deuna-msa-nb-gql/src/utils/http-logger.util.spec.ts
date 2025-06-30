import { HttpLoggerUtil } from './http-logger.util';
import { Logger } from '@deuna/tl-logger-nd';

const loggerMockInstance = {
  logData: jest.fn(),
};

jest.mock('@deuna/tl-logger-nd', () => {
  return {
    Logger: jest.fn().mockImplementation(() => loggerMockInstance),
  };
});

describe('HttpLoggerUtil', () => {
  const context = 'TestContext';
  const className = 'TestClass';
  const methodName = 'testMethod';
  const url = 'http://example.com/api';
  const method = 'POST';
  const traceId = 'trace-id-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logRequest', () => {
    it('should log request with all fields', () => {
      const headers = { Authorization: 'Bearer token' };
      const params = { userId: 1 };
      const payload = { key: 'value' };

      HttpLoggerUtil.logRequest({
        context,
        className,
        methodName,
        url,
        method,
        headers,
        params,
        payload,
        traceId,
      });

      expect(Logger).toHaveBeenCalledWith({ context });
      expect(loggerMockInstance.logData).toHaveBeenCalledWith(
        `[REQUEST] ${method} ${url} | ${className}.${methodName}`,
        { headers, params, payload },
        traceId,
      );
    });

    it('should log request with only required fields', () => {
      HttpLoggerUtil.logRequest({
        context,
        className,
        methodName,
        url,
        method,
      });

      expect(Logger).toHaveBeenCalledWith({ context });
      expect(loggerMockInstance.logData).toHaveBeenCalledWith(
        `[REQUEST] ${method} ${url} | ${className}.${methodName}`,
        {},
        undefined,
      );
    });
  });

  describe('logResponse', () => {
    it('should log response correctly', () => {
      const response = { status: 200, data: 'OK' };

      HttpLoggerUtil.logResponse({
        context,
        className,
        methodName,
        url,
        method,
        response,
        traceId,
      });

      expect(Logger).toHaveBeenCalledWith({ context });
      expect(loggerMockInstance.logData).toHaveBeenCalledWith(
        `[RESPONSE] ${method} ${url} | ${className}.${methodName}`,
        response,
        traceId,
      );
    });
  });
});