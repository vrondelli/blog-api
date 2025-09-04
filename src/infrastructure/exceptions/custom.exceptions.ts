import { HttpException, HttpStatus } from '@nestjs/common';

export class BlogPostNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      {
        error: 'Blog Post Not Found',
        message: `Blog post with ID ${id} was not found`,
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CommentNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      {
        error: 'Comment Not Found',
        message: `Comment with ID ${id} was not found`,
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidCommentParentException extends HttpException {
  constructor(parentId: number) {
    super(
      {
        error: 'Invalid Comment Parent',
        message: `Parent comment with ID ${parentId} does not exist or cannot be used as a parent`,
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(validationErrors: string[]) {
    super(
      {
        error: 'Validation Failed',
        message: 'The request data is invalid',
        details: validationErrors,
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DatabaseConnectionException extends HttpException {
  constructor(originalError?: string) {
    super(
      {
        error: 'Database Connection Error',
        message: 'Unable to connect to the database',
        details: originalError || 'Unknown database error',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class CacheException extends HttpException {
  constructor(operation: string, originalError?: string) {
    super(
      {
        error: 'Cache Operation Failed',
        message: `Cache ${operation} operation failed`,
        details: originalError || 'Unknown cache error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class RateLimitException extends HttpException {
  constructor(limit: number, windowMs: number) {
    super(
      {
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Maximum ${limit} requests per ${windowMs / 1000} seconds`,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil(windowMs / 1000),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
