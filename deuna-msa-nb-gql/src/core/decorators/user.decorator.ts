import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Extracts the user from the execution context.
 * @param _ - The first parameter (unused).
 * @param context - The execution context.
 * @returns The user data from the request.
 */
export const userExtractor = (_: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.data;
};

export const CurrentUser = createParamDecorator(userExtractor);
