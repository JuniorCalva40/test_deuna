import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from './format-logger';

describe('formatLogger', () => {
  let loggerMock: Logger;

  beforeEach(() => {
    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log info messages correctly', () => {
    const message = 'Test info message';
    const sessionId = 'test-session-id';
    const trackingId = 'test-tracking-id';
    const requestId = 'test-request-id';

    formatLogger(loggerMock, 'info', message, sessionId, trackingId, requestId);

    expect(loggerMock.log).toHaveBeenCalledTimes(1);
    const loggedMessage = (loggerMock.log as jest.Mock).mock.calls[0][0];
    expect(loggedMessage).toContain('[INFO]');
    expect(loggedMessage).toContain('Test info message');
    expect(loggedMessage).toContain('SessionId: test-session-id');
    expect(loggedMessage).toContain('TrackingId: test-tracking-id');
    expect(loggedMessage).toContain('RequestId: test-request-id');
  });

  it('should log error messages correctly', () => {
    const message = 'Test error message';
    const sessionId = 'test-session-id';
    const trackingId = 'test-tracking-id';
    const requestId = 'test-request-id';

    formatLogger(
      loggerMock,
      'error',
      message,
      sessionId,
      trackingId,
      requestId,
    );

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    const loggedMessage = (loggerMock.error as jest.Mock).mock.calls[0][0];
    expect(loggedMessage).toContain('[ERROR]');
    expect(loggedMessage).toContain('Test error message');
    expect(loggedMessage).toContain('SessionId: test-session-id');
    expect(loggedMessage).toContain('TrackingId: test-tracking-id');
    expect(loggedMessage).toContain('RequestId: test-request-id');
  });

  it('should properly format error objects', () => {
    const errorObj = {
      status: 500,
      message: 'Internal server error',
      errorCode: 'SERVER_ERROR',
      stack: 'Error stack trace',
    };
    const sessionId = 'test-session-id';
    const trackingId = 'test-tracking-id';
    const requestId = 'test-request-id';

    formatLogger(
      loggerMock,
      'error',
      errorObj,
      sessionId,
      trackingId,
      requestId,
    );

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    const loggedMessage = (loggerMock.error as jest.Mock).mock.calls[0][0];
    expect(loggedMessage).toContain('Error Status: 500');
    expect(loggedMessage).toContain('Error Message: Internal server error');
    expect(loggedMessage).toContain('Error Code: SERVER_ERROR');
    expect(loggedMessage).toContain('Stack Trace:');
    expect(loggedMessage).toContain('Error stack trace');
  });

  it('should handle missing tracking information', () => {
    const message = 'Test message without tracking info';

    formatLogger(loggerMock, 'info', message, undefined, undefined, undefined);

    expect(loggerMock.log).toHaveBeenCalledTimes(1);
    const loggedMessage = (loggerMock.log as jest.Mock).mock.calls[0][0];
    expect(loggedMessage).toContain('SessionId: -');
    expect(loggedMessage).toContain('TrackingId: -');
    expect(loggedMessage).toContain('RequestId: -');
  });

  it('should handle error objects with missing fields', () => {
    const incompleteErrorObj = {
      message: 'Incomplete error object',
      // No status, errorCode or stack
    };

    formatLogger(
      loggerMock,
      'error',
      incompleteErrorObj,
      'session',
      'tracking',
      'request',
    );

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    const loggedMessage = (loggerMock.error as jest.Mock).mock.calls[0][0];
    expect(loggedMessage).toContain('Error Status: error');
    expect(loggedMessage).toContain('Error Message: Incomplete error object');
    expect(loggedMessage).toContain('Error Code: UNKNOWN_ERROR');
    expect(loggedMessage).toContain('No stack trace available');
  });
});
