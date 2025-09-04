# Testing Guide

## E2E Testing Setup

This project includes comprehensive E2E tests that validate the entire blogging API functionality.

### Prerequisites

1. **Test Database**: A separate PostgreSQL database for testing
2. **Docker**: For running the test database container

### Quick Start

```bash
# 1. Start the test database
pnpm run test:db:up

# 2. Setup test database (run migrations)
pnpm run test:setup

# 3. Run E2E tests
pnpm run test:e2e
```

### Test Database Safety

The tests include built-in safety checks:

- ✅ **Database URL Validation**: Tests only run if `DATABASE_URL` contains "test"
- ✅ **Isolated Environment**: Test database runs on port 5433 (separate from dev DB on 5432)
- ✅ **Clean Slate**: Database is reset before each test
- ✅ **No Cross-Contamination**: Tests cannot accidentally affect development data

### Available Test Commands

```bash
# Database Management
pnpm run test:db:up      # Start test database container
pnpm run test:db:down    # Stop test database container
pnpm run test:setup      # Run migrations on test database

# Running Tests
pnpm run test:e2e        # Run all E2E tests
pnpm run test:e2e:watch  # Run tests in watch mode
```

### Test Structure

The E2E tests cover:

**📝 Blog Posts**

- Create blog post
- Get all blog posts
- Get blog post by ID
- Get blog post with comments (lazy loading)
- Validation errors
- 404 handling

**💬 Comments & Replies**

- Create comments
- Create replies (hierarchical)
- Get comments for post
- Get replies for comment
- Validation errors

**📊 Pagination & Sorting**

- Comment pagination
- Sorting options
- Lazy loading with limits

### Environment Variables

Test environment uses `.env.test`:

```env
DATABASE_URL="postgresql://blog_user:blog_password@localhost:5433/blog_test_db"
NODE_ENV=test
```

### Safety Features

1. **Database Name Check**: Tests validate that database URL contains "test"
2. **Port Isolation**: Test DB runs on 5433, dev DB on 5432
3. **Data Reset**: All data is cleared before each test
4. **Environment Isolation**: Separate environment variables

### Troubleshooting

**Test database connection failed:**

```bash
# Check if test database is running
docker ps | grep blog-platform-test-db

# Restart test database
pnpm run test:db:down
pnpm run test:db:up
pnpm run test:setup
```

**Migration errors:**

```bash
# Reset test database
docker-compose down postgres-test
docker volume rm project_postgres_test_data
pnpm run test:db:up
pnpm run test:setup
```

**Tests failing randomly:**

- This usually indicates test isolation issues
- Check that `beforeEach` is properly resetting data
- Ensure no tests are depending on previous test state
