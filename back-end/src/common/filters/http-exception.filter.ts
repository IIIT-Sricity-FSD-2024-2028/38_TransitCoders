import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app.logger';

/**
 * GlobalExceptionFilter — catches EVERY unhandled exception.
 *
 * @Catch() with no argument means it catches HttpException AND all
 * other JS/runtime errors that would otherwise crash with 500.
 *
 * Registered globally in main.ts via app.useGlobalFilters().
 *
 * Response shape:
 *   { success, statusCode, error, path, timestamp }
 *
 * All 5xx errors are also written to logs/error.log via AppLogger.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const resp = exceptionResponse as any;
        message = Array.isArray(resp.message)
          ? resp.message.join(', ')
          : resp.message || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
    }

    const body = {
      success: false,
      statusCode: status,
      error: message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Log 5xx errors to error.log so they persist to disk
    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      AppLogger.error(`${request.method} ${request.url} → ${status}: ${message}`, {
        userId: (request as any).user?.id ?? 'anonymous',
        role: (request as any).user?.role ?? '-',
        stack,
      });
    } else if (status >= 400) {
      // Log 4xx at warn level to access.log (not error.log)
      AppLogger.warn(`${request.method} ${request.url} → ${status}: ${message}`, {
        userId: (request as any).user?.id ?? 'anonymous',
        role: (request as any).user?.role ?? '-',
      });
    }

    response.status(status).json(body);
  }
}
