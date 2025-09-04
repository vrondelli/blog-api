#!/bin/bash

echo "🧪 Setting up test environment..."

# Check if test database is running
if ! nc -z localhost 5433 2>/dev/null; then
    echo "❌ Test database is not running on port 5433"
    echo "Please start the test database with: docker compose up postgres-test -d"
    exit 1
fi

echo "✅ Test database is running"

# Run Prisma migrations on test database
echo "🔄 Running database migrations..."
export DATABASE_URL="postgresql://blog_user:blog_password@localhost:5433/blog_test_db"
npx prisma migrate dev --name test-setup --skip-generate

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "✅ Test environment is ready!"
echo "Run tests with: pnpm test:e2e"
