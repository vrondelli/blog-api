import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    cache: 'ok' | 'error';
  };
  version?: string;
}

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Check the health status of the application and its dependencies',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'string', enum: ['ok', 'error'] },
            cache: { type: 'string', enum: ['ok', 'error'] },
          },
        },
        version: { type: 'string' },
      },
    },
  })
  async getHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    let databaseStatus: 'ok' | 'error' = 'ok';
    let cacheStatus: 'ok' | 'error' = 'ok';

    // Check database connection
    try {
      await this.databaseService.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = 'error';
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : 'Unknown error',
        'HealthController',
      );
    }

    // Check cache connection
    try {
      await this.cacheService.getBlogPost(0); // This will return undefined but tests connectivity
    } catch (error) {
      cacheStatus = 'error';
      this.logger.error(
        'Cache health check failed',
        error instanceof Error ? error.stack : 'Unknown error',
        'HealthController',
      );
    }

    const overallStatus =
      databaseStatus === 'ok' && cacheStatus === 'ok' ? 'ok' : 'error';
    const responseTime = Date.now() - startTime;

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: databaseStatus,
        cache: cacheStatus,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    this.logger.debug(
      `Health check completed in ${responseTime}ms - Status: ${overallStatus}`,
      'HealthController',
    );

    return response;
  }

  @Get('ping')
  @ApiOperation({
    summary: 'Ping endpoint',
    description: 'Simple ping endpoint to test API connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'Pong response',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'pong' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  ping(): { message: string; timestamp: string } {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}
