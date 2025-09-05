import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    // Log the DATABASE_URL to see what Prisma is receiving
    console.log('DATABASE_URL in constructor:', process.env.DATABASE_URL);
    
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);
        this.logger.log(`Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.logger.error(`Database connection attempt ${attempt} failed:`, error);
        this.logger.error(`Error details: ${error instanceof Error ? error.message : String(error)}`);
        
        if (attempt === maxRetries) {
          this.logger.error('Max connection attempts reached. Throwing error.');
          throw error;
        }
        
        this.logger.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
