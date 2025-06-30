import { Logger } from '@deuna/tl-logger-nd';

interface HttpLogParams {
  context: string;
  className: string;
  methodName: string;
  url: string;
  method: string;
  headers?: Record<string, any>;
  params?: Record<string, any>;
  payload?: any;
  response?: any;
  traceId?: string;
}

export class HttpLoggerUtil {
  static logRequest({
    context,
    className,
    methodName,
    url,
    method,
    headers,
    params,
    payload,
    traceId,
  }: Omit<HttpLogParams, 'response'>): void {
    const logger = new Logger({ context });

    const requestData: Record<string, any> = {};
    if (headers) requestData.headers = headers;
    if (params) requestData.params = params;
    if (payload) requestData.payload = payload;

    logger.logData(
      `[REQUEST] ${method.toUpperCase()} ${url} | ${className}.${methodName}`,
      requestData,
      traceId,
    );
  }

  static logResponse({
    context,
    className,
    methodName,
    url,
    method,
    response,
    traceId,
  }: Omit<HttpLogParams, 'headers' | 'params' | 'payload'>): void {
    const logger = new Logger({ context });

    logger.logData(
      `[RESPONSE] ${method.toUpperCase()} ${url} | ${className}.${methodName}`,
      response,
      traceId,
    );
  }
}