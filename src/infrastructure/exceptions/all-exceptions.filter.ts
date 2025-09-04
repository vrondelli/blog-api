import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '../logging/winston-logger.service';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
  retryAfter?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error with appropriate level
    this.logError(exception, request, errorResponse);

    // Set retry-after header for rate limit errors
    if (errorResponse.retryAfter) {
      response.header('Retry-After', errorResponse.retryAfter.toString());
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle HTTP exceptions (including our custom ones)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        return {
          ...(exceptionResponse as any),
          path,
          timestamp,
        };
      }

      return {
        error: exception.name,
        message: exception.message,
        statusCode: status,
        timestamp,
        path,
      };
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, path, timestamp);
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return {
        error: 'Database Error',
        message: 'An unknown database error occurred',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp,
        path,
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        error: 'Database Validation Error',
        message: 'Invalid data provided to database',
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
      };
    }

    // Handle validation errors
    if (this.isValidationError(exception)) {
      return {
        error: 'Validation Failed',
        message: 'Request validation failed',
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        details: this.extractValidationDetails(exception),
      };
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        error: 'Internal Server Error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp,
        path,
      };
    }

    // Fallback for unknown exception types
    return {
      error: 'Unknown Error',
      message: 'An unknown error occurred',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
    };
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    path: string,
    timestamp: string,
  ): ErrorResponse {
    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        return {
          error: 'Duplicate Entry',
          message: `A record with this ${exception.meta?.target} already exists`,
          statusCode: HttpStatus.CONFLICT,
          timestamp,
          path,
        };

      case 'P2014': // Invalid ID
        return {
          error: 'Invalid Reference',
          message: 'The provided ID does not exist',
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
        };

      case 'P2003': // Foreign key constraint violation
        return {
          error: 'Reference Error',
          message: 'Cannot perform operation due to related records',
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
        };

      case 'P2025': // Record not found
        return {
          error: 'Record Not Found',
          message: 'The requested record was not found',
          statusCode: HttpStatus.NOT_FOUND,
          timestamp,
          path,
        };

      default:
        return {
          error: 'Database Error',
          message: 'A database error occurred',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp,
          path,
        };
    }
  }

  private isValidationError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'isValidationError' in exception
    );
  }

  private extractValidationDetails(exception: unknown): string[] {
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'validationErrors' in exception &&
      Array.isArray((exception as any).validationErrors)
    ) {
      return (exception as any).validationErrors;
    }
    return [];
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    const logContext = {
      method,
      url,
      ip,
      userAgent,
      statusCode: errorResponse.statusCode,
      timestamp: errorResponse.timestamp,
    };

    if (errorResponse.statusCode >= 500) {
      // Server errors - log as error with full stack trace
      this.logger.error(
        `${method} ${url} - ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : undefined,
        'AllExceptionsFilter',
      );
    } else if (errorResponse.statusCode >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `${method} ${url} - ${errorResponse.message}`,
        'AllExceptionsFilter',
      );
    } else {
      // Other errors - log as info
      this.logger.log(
        `${method} ${url} - ${errorResponse.message}`,
        'AllExceptionsFilter',
      );
    }

    // Log additional context in debug mode
    this.logger.debug(
      `Error context: ${JSON.stringify(logContext)}`,
      'AllExceptionsFilter',
    );
  }
}
