# Test Structure

Essential tests for the blogging platform API.

## 📁 Directory Structure

```
src/                                   # Source code with co-located unit tests
├── infrastructure/
│   ├── cache/
│   │   ├── cache.service.ts
│   │   └── cache.service.test.ts     # ✅ Unit tests (.test.ts)
│   └── exceptions/
│       ├── all-exceptions.filter.ts
│       └── all-exceptions.filter.test.ts # ✅ Unit tests (.test.ts)
│
test/                                  # E2E tests only
├── README.md                          # This documentation
├── jest-e2e.json                     # E2E test configuration
│
├── e2e/                              # End-to-end tests (.spec.ts)
│   ├── blog-api.spec.ts             # Core API functionality
│   ├── error-handling.spec.ts       # Error scenarios
│   └── cache-integration.spec.ts    # Cache validation
│
└── setup/                            # Test configuration
    ├── e2e-setup.ts                  # E2E utilities
    ├── global-setup.ts               # Jest setup
    ├── global-teardown.ts            # Jest teardown
    └── setup-tests.ts                # Environment setup
```

## 🎯 Test Naming Convention

### Unit Tests (`.test.ts`)

- **Location**: Co-located with source files
- **Naming**: `[filename].test.ts`
- **Purpose**: Test individual components in isolation

### E2E Tests (`.spec.ts`)

- **Location**: `test/e2e/` directory
- **Naming**: `[feature].spec.ts`
- **Purpose**: Test complete user journeys

## 🎯 Essential Tests

### Unit Tests (Co-located)

- **Cache Service**: Redis caching functionality (`src/infrastructure/cache/cache.service.test.ts`)
- **Exception Filter**: Error handling and logging (`src/infrastructure/exceptions/all-exceptions.filter.test.ts`)

### E2E Tests (`test/e2e/`)

- **Blog API**: CRUD operations for posts and comments (`blog-api.spec.ts`)
- **Error Handling**: Validation, rate limiting, custom errors (`error-handling.spec.ts`)
- **Cache Integration**: Cache invalidation and performance (`cache-integration.spec.ts`)

## 🚀 Running Tests

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### Specific Tests

```bash
npm test -- cache.service.test
npm run test:e2e -- blog-api
npm run test:e2e -- error-handling
```

## 🛠️ Test Utilities

### E2ETestSetup

Shared utilities for E2E tests:

- Application instance management
- Database reset between tests
- Cache clearing for isolation

### Usage

```typescript
import { E2ETestSetup } from '../setup/e2e-setup';

beforeAll(async () => {
  app = await E2ETestSetup.getApp();
});

beforeEach(async () => {
  await E2ETestSetup.resetDatabase();
});
```

## � Test Coverage

These tests cover:

- ✅ Core blog functionality (CRUD)
- ✅ Comment system with replies
- ✅ Error handling and validation
- ✅ Caching strategy
- ✅ Rate limiting
- ✅ Database operations

Sufficient for production deployment with confidence.
