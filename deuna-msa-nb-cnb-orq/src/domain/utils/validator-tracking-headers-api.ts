import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from './format-logger';
import { BadRequestException } from '@nestjs/common';

/**
 * Validate the tracking headers for the API
 * @param logger - The logger instance
 * @param context - The context of the request
 * @param sessionId - The session ID
 * @param trackingId - The tracking ID
 * @param requestId - The request ID
 */
export const validateTrackingHeadersApi = (
  logger: Logger,
  context: string,
  sessionId?: string,
  trackingId?: string,
  requestId?: string,
) => {
  const missingHeaders = [];

  if (!sessionId?.trim()) {
    missingHeaders.push('sessionId');
  }
  if (!trackingId?.trim()) {
    missingHeaders.push('trackingId');
  }
  if (!requestId?.trim()) {
    missingHeaders.push('requestId');
  }

  if (missingHeaders.length > 0) {
    formatLogger(
      logger,
      'error',
      `Missing headers: ${missingHeaders.join(', ')}`,
      sessionId,
      trackingId,
      requestId,
    );

    throw new BadRequestException({
      message: 'Missing required headers',
      statusCode: 400,
      errors: [
        {
          reason: 'bad_request',
          details: `The following headers are required but missing: ${missingHeaders.join(', ')}`,
          code: 1000,
          source: 'validation',
          missingHeaders: missingHeaders,
        },
      ],
    });
  }

  formatLogger(
    logger,
    'info',
    `Controller - ${context}`,
    sessionId,
    trackingId,
    requestId,
  );
};
