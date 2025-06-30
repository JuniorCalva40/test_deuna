import { Logger } from '@deuna/tl-logger-nd';

/**
 * Formatea el mensaje de log de forma estructurada
 * @param logger - Instancia del logger
 * @param type - Tipo de mensaje (info, error)
 * @param message - Mensaje a registrar
 * @param sessionId - ID de sesión
 * @param trackingId - ID de tracking
 * @param requestId - ID de solicitud
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

  // Si el mensaje es un objeto de error, formatearlo adecuadamente
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
