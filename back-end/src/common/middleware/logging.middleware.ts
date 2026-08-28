/**
 * LoggingMiddleware — NestMiddleware (NOT a Guard, Interceptor, or Filter).
 *
 * Registered via AppModule.configure(consumer) → MiddlewareConsumer.
 * Applies to every route.
 *
 * Logs to logs/access.log:
 *   - Timestamp (from Winston)
 *   - HTTP Method
 *   - URL / path
 *   - Response status code
 *   - Response time (ms)
 *   - Client IP address
 *   - userId (from request.user if available, set by AuthGuard)
 *   - role  (from request.user if available)
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from '../logger/app.logger';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    // After the response is finished, log the completed request
    res.on('finish', () => {
      const elapsed = Date.now() - start;
      const status = res.statusCode;
      const user = (req as any).user;
      const userId = user?.id ?? 'anonymous';
      const role = user?.role ?? '-';

      const msg = `${method} ${originalUrl} ${status} ${elapsed}ms`;
      const meta = { ip, userId, role, status, elapsed };

      if (status >= 500) {
        AppLogger.error(msg, meta);
      } else if (status >= 400) {
        AppLogger.warn(msg, meta);
      } else {
        AppLogger.info(msg, meta);
      }
    });

    next();
  }
}
