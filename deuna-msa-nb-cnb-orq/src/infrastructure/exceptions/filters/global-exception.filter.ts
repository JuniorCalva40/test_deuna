import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from '@deuna/tl-logger-nd';
import { ApplicationError } from '@src/application/errors/application-error';
import { ServiceUnavailableError } from '@src/application/errors/service-unavailable.error';
import { KafkaContext } from '@nestjs/microservices';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // Determine the type of context (HTTP or RPC/Kafka)
    const contextType = host.getType();

    // Handle HTTP exceptions
    if (contextType === 'http') {
      this.handleHttpException(exception, host);
    }
    // Handle Kafka exceptions
    else if (contextType === 'rpc') {
      this.handleRpcException(exception, host);
    }
    // Handle other types of exceptions
    else {
      this.logger.error(
        `Unhandled exception in context ${contextType}:`,
        exception instanceof Error ? exception : new Error(String(exception)),
      );
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
      errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
    } else if (exception instanceof ServiceUnavailableError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = exception.message;
      errorCode = 'SERVICE_UNAVAILABLE';
      details = {
        service: exception.service,
        endpoint: exception.endpoint,
        stack: exception.stack,
      };
    } else if (exception instanceof ApplicationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      errorCode = exception.name;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'UNKNOWN_ERROR';
    }

    // Si no se establecieron detalles específicos, usar el stack trace
    if (Object.keys(details).length === 0) {
      details = {
        stack:
          exception instanceof Error
            ? exception.stack
            : 'No stack trace available',
      };
    }

    this.logger.error(`${errorCode}: ${message}`);

    response.status(status).json({
      status: 'error',
      message: message,
      errorCode: errorCode,
      details: details,
    });
  }

  private handleRpcException(exception: unknown, host: ArgumentsHost) {
    // No necesitamos responder en el contexto Kafka, solo registrar el error
    let message = 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
      errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
    } else if (exception instanceof ApplicationError) {
      message = exception.message;
      errorCode = 'APPLICATION_ERROR';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'UNKNOWN_ERROR';
    }

    // Get Kafka context information if available
    try {
      const kafkaContext = host.getArgByIndex(1) as KafkaContext;
      if (kafkaContext) {
        const topic = kafkaContext.getTopic();
        const partition = kafkaContext.getPartition();
        const offset = kafkaContext.getMessage()?.offset;

        this.logger.error(
          `Error in Kafka message - Topic: ${topic}, Partition: ${partition}, Offset: ${offset}, Error: ${errorCode}: ${message}`,
          exception instanceof Error ? exception : new Error(String(exception)),
        );

        // Try to confirm the message to avoid infinite retries
        try {
          kafkaContext.getConsumer().commitOffsets([
            {
              topic,
              partition,
              offset: (Number(offset) + 1).toString(),
            },
          ]);
        } catch (commitError) {
          this.logger.error(
            `Error confirming Kafka offset:`,
            commitError instanceof Error
              ? commitError
              : new Error(String(commitError)),
          );
        }
      }
    } catch (contextError) {
      // If we can't get the Kafka context, simply log the original error
      this.logger.error(
        `${errorCode}: ${message}`,
        exception instanceof Error ? exception : new Error(String(exception)),
      );
    }
  }
}
