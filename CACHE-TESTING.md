# Redis Cache Testing Guide

This guide provides comprehensive instructions for testing the Redis caching implementation in the blogging platform API.

## Test Structure

We have created three levels of cache testing:

### 1. Unit Tests (`test/cache.service.spec.ts`)

**Purpose**: Test the `CacheService` class in isolation using in-memory cache

**What it tests**:

- Basic cache operations (get, set, delete)
- Blog post caching with TTL
- Comments pagination caching
- Hierarchical replies caching
- Cache invalidation strategies
- Error handling

**Run with**:

```bash
npx jest --testPathPattern=cache.service.spec.ts --rootDir=.
```

### 2. Integration Tests (`test/cache-integration.e2e-spec.ts`)

**Purpose**: Test caching behavior within the actual API endpoints

**What it tests**:

- API endpoints serving cached responses
- Cache invalidation when data changes
- Different cache keys for different parameters
- Database query reduction with cache hits
- Performance improvements with caching

**Run with**:

```bash
npm run test:cache:integration
```

**Prerequisites**:

- Test database running on port 5433
- Redis instance available (optional for tests)

### 3. Redis Performance Tests (`test/redis-performance.spec.ts`)

**Purpose**: Test Redis-specific performance and features

**What it tests**:

- Redis connection and basic operations
- Performance benchmarks
- Large object handling
- Concurrent operations
- Error resilience
- TTL behavior with actual Redis

**Run with**:

```bash
npm run test:redis:performance
```

**Prerequisites**:

- Redis server running (docker: `npm run redis:up`)

## Manual Cache Validation

### 1. Start the Required Services

```bash
# Start Redis
npm run redis:up

# Start test database
npm run test:db:up

# Start the application
npm run start:dev
```

### 2. Test Cache Behavior Manually

#### Blog Posts List Caching

```bash
# First request - cache miss (check logs for "Cache miss")
curl http://localhost:3000/blog-posts

# Second request - cache hit (check logs for "Cache hit")
curl http://localhost:3000/blog-posts

# Create new post - invalidates cache
curl -X POST http://localhost:3000/blog-posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Test Content","author":"Test Author"}'

# Third request - cache miss again (fresh data)
curl http://localhost:3000/blog-posts
```

#### Single Post with Comments Caching

```bash
# Get post ID from previous request, then:
POST_ID=1

# First request with comments - cache miss
curl "http://localhost:3000/blog-posts/${POST_ID}?includeComments=true"

# Second request - cache hit
curl "http://localhost:3000/blog-posts/${POST_ID}?includeComments=true"

# Add comment - invalidates cache
curl -X POST "http://localhost:3000/blog-posts/${POST_ID}/comments" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test comment","author":"Test Author"}'

# Third request - cache miss (fresh data with new comment)
curl "http://localhost:3000/blog-posts/${POST_ID}?includeComments=true"
```

### 3. Monitor Cache with Redis CLI

```bash
# Connect to Redis CLI
npm run redis:cli

# View all cache keys
KEYS *

# View specific cache content
GET "blog_posts_list"
GET "blog_post:1"
GET "post_with_comments:1:true:10:1:most_recent"

# Clear all cache
FLUSHALL

# Monitor cache operations in real-time
MONITOR
```

## Cache Key Patterns

Understanding the cache key patterns helps with debugging:

```
blog_posts_list                                    # All blog posts
blog_post:{id}                                     # Single blog post
post_with_comments:{id}:{includeComments}:{limit}:{page}:{sort} # Post with comments
comments:{postId}:{page}:{limit}:{sort}            # Comments pagination
replies:{commentId}:{page}:{limit}                 # Comment replies
```

## Performance Validation

### 1. Database Query Reduction

Monitor your application logs to see cache hits vs misses:

```
✅ Cache hit: blog_posts_list
❌ Cache miss: blog_posts_list - fetching from database
🗑️ Cache invalidated: blog_posts_list
```

### 2. Response Time Improvement

Use tools like `curl` with timing:

```bash
# Measure response time
time curl http://localhost:3000/blog-posts

# First request (cache miss): ~100-200ms
# Second request (cache hit): ~10-50ms
```

### 3. Redis Performance Metrics

Check Redis performance:

```bash
# Redis CLI
npm run redis:cli

# Get Redis info
INFO stats
INFO memory
INFO keyspace

# Monitor operations per second
INFO stats | grep instantaneous_ops_per_sec
```

## Common Issues and Troubleshooting

### 1. Cache Service Not Working

**Symptoms**: No cache hits in logs, always fetching from database

**Solutions**:

- Check Redis connection: `npm run redis:cli`
- Verify environment variables: `REDIS_URL`
- Check application logs for Redis connection errors

### 2. Cache Not Invalidating

**Symptoms**: Stale data served after updates

**Solutions**:

- Check if invalidation logic is called in use cases
- Verify cache keys match between set and invalidate operations
- Clear cache manually: `npm run cache:clear`

### 3. Tests Failing

**Symptoms**: Cache tests fail or timeout

**Solutions**:

- Ensure test database is running: `npm run test:db:up`
- For Redis tests, ensure Redis is available
- Check for port conflicts (5433 for test DB, 6379 for Redis)

### 4. Performance Not Improved

**Symptoms**: Similar response times with and without cache

**Solutions**:

- Verify cache TTL is appropriate (not too short)
- Check if cache is being invalidated too frequently
- Monitor cache hit ratio in Redis: `INFO stats`

## Cache Configuration

### TTL (Time To Live) Settings

Current TTL configuration in `CacheService`:

```typescript
// Blog posts: 30 minutes
private readonly BLOG_POST_TTL = 30 * 60 * 1000;

// Comments: 15 minutes
private readonly COMMENTS_TTL = 15 * 60 * 1000;

// Post lists: 10 minutes
private readonly POST_LIST_TTL = 10 * 60 * 1000;

// Composite responses: 20 minutes
private readonly COMPOSITE_TTL = 20 * 60 * 1000;
```

### Environment-Based Configuration

- **Production/Development**: Uses Redis with above TTL settings
- **Testing**: Uses in-memory cache with shorter TTL (60 seconds)

## Expected Test Results

When all tests pass, you should see:

1. **Unit Tests**: ~20+ tests covering all cache operations
2. **Integration Tests**: ~10+ tests covering API caching behavior
3. **Performance Tests**: Demonstrate significant performance improvements
4. **Manual Tests**: Visible cache hits/misses in application logs

## Performance Benchmarks

Expected performance improvements with caching:

- **Response Time**: 70-90% reduction for cached responses
- **Database Load**: 80-95% reduction in database queries for cached data
- **Throughput**: 3-5x improvement in requests per second for cached endpoints
- **Redis Operations**: <10ms for GET operations, <50ms for SET operations

This comprehensive testing approach ensures your Redis caching implementation is working correctly and providing the expected performance benefits.
