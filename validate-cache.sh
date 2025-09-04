#!/bin/bash

echo "🧪 Redis Cache Validation Script"
echo "================================"

# Check if Redis is running
echo "1. Checking Redis connectivity..."
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running and responsive"
else
    echo "❌ Redis is not running. Starting Redis..."
    npm run redis:up
    sleep 3
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Failed to start Redis"
        exit 1
    fi
fi

# Test basic Redis operations
echo ""
echo "2. Testing basic Redis operations..."
docker compose exec -T redis redis-cli set "test:validation" "cache-test-$(date +%s)" > /dev/null
RETRIEVED=$(docker compose exec -T redis redis-cli get "test:validation" | tr -d '\r')
if [ -n "$RETRIEVED" ]; then
    echo "✅ Redis SET/GET operations working"
    echo "   Stored and retrieved: $RETRIEVED"
else
    echo "❌ Redis operations failed"
fi

# Clean up test key
docker compose exec -T redis redis-cli del "test:validation" > /dev/null

# Check cache keys if any exist
echo ""
echo "3. Current cache state..."
KEY_COUNT=$(docker compose exec -T redis redis-cli dbsize | tr -d '\r')
echo "   Current cache keys: $KEY_COUNT"

if [ "$KEY_COUNT" -gt "0" ]; then
    echo "   Sample keys:"
    docker compose exec -T redis redis-cli keys "*" | head -5 | sed 's/^/   - /'
fi

# Test cache clearing
echo ""
echo "4. Testing cache management..."
docker compose exec -T redis redis-cli set "temp:test" "value" > /dev/null
BEFORE_CLEAR=$(docker compose exec -T redis redis-cli dbsize | tr -d '\r')
npm run cache:clear > /dev/null 2>&1
AFTER_CLEAR=$(docker compose exec -T redis redis-cli dbsize | tr -d '\r')

if [ "$AFTER_CLEAR" -eq "0" ]; then
    echo "✅ Cache clearing works correctly"
    echo "   Keys before clear: $BEFORE_CLEAR, after clear: $AFTER_CLEAR"
else
    echo "⚠️  Cache clearing may not have worked completely"
fi

echo ""
echo "🎉 Redis cache validation complete!"
echo ""
echo "To run cache tests:"
echo "  npm run test:cache              # Unit tests"
echo "  npm run test:cache:integration  # Integration tests"
echo "  npm run test:redis:performance  # Performance tests"
echo ""
echo "To monitor cache in real-time:"
echo "  npm run redis:cli"
echo "  > MONITOR"
