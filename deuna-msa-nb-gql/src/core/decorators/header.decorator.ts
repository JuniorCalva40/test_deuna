import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Extracts the headers from the request context.
 * @param _ - The first parameter (unused).
 * @param context - The execution context.
 * @returns The headers from the request.
 */
export const headerExtractor = (_: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.headers;
};

/**
 * Extracts a specific header value from the request context.
 * @param headerName - The name of the header to extract.
 * @param context - The execution context.
 * @returns The value of the specified header.
 */
export const headerValueExtractor = (
  headerName: string,
  context: ExecutionContext,
) => {
  const ctx = GqlExecutionContext.create(context);
  const headers = ctx.getContext().req.headers;

  // Seeks the header in different formats
  const headerValue =
    headers[headerName] ||
    headers[headerName.toLowerCase()] ||
    headers[headerName.toUpperCase()];

  if (!headerValue) {
    throw new Error(`Header ${headerName} not found in request`);
  }

  return headerValue;
};

export const Headers = createParamDecorator(headerExtractor);

export const HeaderValue = createParamDecorator(headerValueExtractor);
