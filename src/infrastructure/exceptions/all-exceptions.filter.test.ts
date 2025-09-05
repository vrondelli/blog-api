import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { WinstonLoggerService } from '../logging/winston-logger.service';
import { Prisma } from '@prisma/client';
import {
  BlogPostNotFoundException,
  ValidationException,
  RateLimitException,
} from './custom.exceptions';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logger: jest.Mocked<WinstonLoggerService>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
    header: jest.Mock;
  };
  let mockRequest: {
    url: string;
    method: string;
    ip: string;
    headers: Record<string, string>;
  };

  beforeEach(async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: (): typeof mockResponse => mockResponse,
        getRequest: (): typeof mockRequest => mockRequest,
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WinstonLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    logger = module.get<WinstonLoggerService>(
      WinstonLoggerService,
    ) as jest.Mocked<WinstonLoggerService>;

    filter = new AllExceptionsFilter(logger);
  });

  describe('Custom HTTP Exceptions', () => {
    it('should handle BlogPostNotFoundException correctly', () => {
      const exception = new BlogPostNotFoundException(123);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Blog Post Not Found',
          message: 'Blog post with ID 123 was not found',
          statusCode: 404,
          path: '/api/test',
          timestamp: expect.any(String),
        }),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/test'),
        'AllExceptionsFilter',
      );
    });

    it('should handle ValidationException correctly', () => {
      const validationErrors = ['Field is required', 'Invalid format'];
      const exception = new ValidationException(validationErrors);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Failed',
          message: 'The request data is invalid',
          statusCode: 400,
          details: validationErrors,
          path: '/api/test',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle RateLimitException with retry-after header', () => {
      const exception = new RateLimitException(100, 60000);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.header).toHaveBeenCalledWith('Retry-After', '60');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate Limit Exceeded',
          statusCode: 429,
          retryAfter: 60,
        }),
      );
    });
  });

  describe('Prisma Exceptions', () => {
    it('should handle unique constraint violation (P2002)', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Duplicate Entry',
          message: 'A record with this email already exists',
          statusCode: 409,
        }),
      );
    });

    it('should handle record not found (P2025)', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Record Not Found',
          message: 'The requested record was not found',
          statusCode: 404,
        }),
      );
    });

    it('should handle foreign key constraint violation (P2003)', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint violation',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Reference Error',
          message: 'Cannot perform operation due to related records',
          statusCode: 400,
        }),
      );
    });

    it('should handle unknown Prisma errors', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '4.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database Error',
          message: 'A database error occurred',
          statusCode: 500,
        }),
      );
    });

    it('should handle validation errors from Prisma', () => {
      const exception = new Prisma.PrismaClientValidationError(
        'Validation error',
        { clientVersion: '4.0.0' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database Validation Error',
          message: 'Invalid data provided to database',
          statusCode: 400,
        }),
      );
    });
  });

  describe('Generic HTTP Exceptions', () => {
    it('should handle standard HttpException', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HttpException',
          message: 'Bad request',
          statusCode: 400,
        }),
      );
    });
  });

  describe('Generic Errors', () => {
    it('should handle generic Error objects', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error',
          statusCode: 500,
          path: '/api/test',
        }),
      );
    });

    it('should handle unknown exception types', () => {
      const exception = 'string exception';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unknown Error',
          message: 'An unknown error occurred',
          statusCode: 500,
        }),
      );
    });
  });

  describe('Logging Behavior', () => {
    it('should log server errors (5xx) as error level', () => {
      const exception = new Error('Internal server error');

      filter.catch(exception, mockArgumentsHost);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/test'),
        expect.any(String),
        'AllExceptionsFilter',
      );
    });

    it('should log client errors (4xx) as warning level', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/test'),
        'AllExceptionsFilter',
      );
    });

    it('should log debug information', () => {
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Error context:'),
        'AllExceptionsFilter',
      );
    });
  });

  describe('Production vs Development', () => {
    it('should hide error messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const exception = new Error('Sensitive error information');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An unexpected error occurred',
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should show error messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const exception = new Error('Detailed error information');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Detailed error information',
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
