import { Logger } from '@deuna/tl-logger-nd';

/**
 * For format the log message in a structured way
 * @param logger - Instance of the logger
 * @param type - Type of message (info, error)
 * @param message - Message to register
 * @param sessionId - Session ID
 * @param trackingId - Tracking ID
 * @param requestId - Request ID
 */
export const formatLogger = (
  logger: Logger,
  type: string,
  message: string | any,
  sessionId: string,
  trackingId: string,
  requestId: string,
) => {
  const timestamp = new Date().toISOString();
  const typeIcon = type === 'info' ? '✨' : '⚠️';

  let formattedMessage = `${typeIcon} [${type.toUpperCase()}] - ${timestamp}`;

  // If the message is an error object, format it appropriately
  if (typeof message === 'object' && message !== null) {
    const errorDetails = {
      status: message.status || 'error',
      message: message.message || 'Unknown error',
      errorCode: message.errorCode || 'UNKNOWN_ERROR',
      stack: message.details?.stack || message.stack,
    };

    formattedMessage +=
      '\n' +
      `📝 Error Status: ${errorDetails.status}\n` +
      `💬 Error Message: ${errorDetails.message}\n` +
      `🔍 Error Code: ${errorDetails.errorCode}\n` +
      `📚 Stack Trace:\n${errorDetails.stack || 'No stack trace available'}`;
  } else {
    formattedMessage += ` | 📝 Message: ${message}`;
  }

  formattedMessage +=
    ` | 🔑 SessionId: ${sessionId || '-'} | ` +
    `🔄 TrackingId: ${trackingId || '-'} | ` +
    `🎯 RequestId: ${requestId || '-'}`;

  if (type === 'info') {
    logger.log(formattedMessage);
  } else if (type === 'error') {
    logger.error(formattedMessage);
  }
};
