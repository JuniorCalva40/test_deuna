import { Logger } from '@deuna/tl-logger-nd';
import { Observable, throwError } from 'rxjs';
import { formatLogger } from './format-logger';
import { ServiceUnavailableError } from '../../application/errors/service-unavailable.error';

/**
 * Handles connection errors to external services and other errors
 * @param method - Name of the method that generated the error
 * @param error - Original error
 * @param serviceName - Name of the service
 * @param serviceUrl - URL of the service
 * @param logger - Logger instance
 * @param trackingData - Tracking data
 * @returns Observable with the formatted error
 */
export const handleServiceError = (
  method: string,
  error: any,
  serviceName: string,
  serviceUrl: string,
  logger: Logger,
  trackingData: { trackingId: string; sessionId: string; requestId: string },
): Observable<never> => {
  const { trackingId, sessionId, requestId } = trackingData;

  // Detect if it is a connection error based on the error type or message
  if (
    error.name === 'AggregateError' ||
    error.code === 'ECONNREFUSED' ||
    error.message?.includes('connect') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('socket')
  ) {
    const errorMessage = `Cannot connect to service ${serviceName}: ${serviceUrl}. The service is not responding or is unavailable.`;

    formatLogger(
      logger,
      'error',
      {
        status: 'error',
        message: errorMessage,
        errorCode: 'SERVICE_UNAVAILABLE',
        details: {
          stack: error.stack,
          originalError: error.message,
        },
      },
      sessionId,
      trackingId,
      requestId,
    );

    // Create a custom error for unavailable services
    return throwError(
      () => new ServiceUnavailableError(errorMessage, serviceName, serviceUrl),
    );
  }

  formatLogger(
    logger,
    'error',
    `${method} - Error: ${error.message}`,
    sessionId,
    trackingId,
    requestId,
  );
  return throwError(() => error);
};
