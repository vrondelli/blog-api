import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';

export class E2ETestSetup {
  private static app: INestApplication;
  private static databaseService: DatabaseService;
  private static cacheService: CacheService;
  private static initPromise: Promise<void> | null = null;

  static async initialize(): Promise<void> {
    // Use a singleton pattern to ensure initialization happens only once
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private static async _doInitialize(): Promise<void> {
    // Validate we're using test database - only once
    const testDbUrl = process.env.DATABASE_URL;
    if (!testDbUrl || !testDbUrl.includes('test')) {
      throw new Error(
        'DATABASE_URL must contain "test" to ensure we are using test database. ' +
          'Current: ' +
          (testDbUrl || 'undefined'),
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    this.cacheService = moduleFixture.get<CacheService>(CacheService);

    await this.app.init();
  }

  static async getApp(): Promise<INestApplication> {
    await this.initialize();
    return this.app;
  }

  static async getDatabaseService(): Promise<DatabaseService> {
    await this.initialize();
    return this.databaseService;
  }

  static async getCacheService(): Promise<CacheService> {
    await this.initialize();
    return this.cacheService;
  }

  static async resetDatabase(): Promise<void> {
    const databaseService = await this.getDatabaseService();
    const cacheService = await this.getCacheService();

    // Clear cache and database
    await cacheService.reset();

    // Delete all data in reverse order to handle foreign key constraints
    await databaseService.comment.deleteMany();
    await databaseService.blogPost.deleteMany();
  }

  static async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.initPromise = null;
    }
  }
}
