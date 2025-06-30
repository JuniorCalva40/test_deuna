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

export const Headers = createParamDecorator(headerExtractor);
