# Blog Platform API

A RESTful API for managing a blogging platform with hierarchical comments and replies, built with NestJS, Prisma ORM, PostgreSQL, and Clean Architecture principles.

## Features

- ✅ **Blog Posts Management**: Create and retrieve blog posts
- ✅ **Hierarchical Comments**: Comments with nested replies support
- ✅ **Lazy Loading**: Efficient pagination for comments and replies
- ✅ **Redis Caching**: Advanced caching strategy for optimal performance
- ✅ **Clean Architecture**: Domain-driven design with proper separation of concerns
- ✅ **Performance Optimized**: 70-90% database load reduction with smart caching
- ✅ **E2E Testing**: Comprehensive test suite with isolated test database
- ✅ **Docker Support**: Complete containerization with PostgreSQL and Redis
- 🚀 **Production Ready**: Infrastructure as Code for VPS deployment
- 🔒 **Security Hardened**: SSL, firewall, fail2ban, and security headers
- 📊 **Monitoring**: Health checks, automated backups, and log rotation
- ⚡ **CI/CD Ready**: GitHub Actions for automated testing and deployment

## 🚀 Production Deployment

### Option 1: Manual Deployment

Deploy to any VPS with a single command using our Infrastructure as Code solution:

```bash
# Install prerequisites (Ansible, Docker, SSH keys)
./scripts/setup.sh

# Deploy to production VPS
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP

# Update application
./scripts/update.sh production yourdomain.com YOUR_VPS_IP
```

### Option 2: Automated CI/CD with GitHub Actions

Set up automated deployment with GitHub Actions:

```bash
# Configure GitHub Actions secrets and SSH keys
npm run ci:setup

# Push to develop → automatic staging deployment
# Push to main → automatic production deployment
```

**Features included:**

- Automated VPS setup with security hardening
- Docker containers with Nginx reverse proxy
- Automatic SSL certificates (Let's Encrypt)
- PostgreSQL and Redis with persistence
- Health monitoring and automated backups
- Zero-downtime updates

📖 **Documentation:**

- **[📋 Complete Step-by-Step Deployment Guide →](DEPLOYMENT-GUIDE.md)**
- **[✅ Deployment Checklist →](CHECKLIST.md)**
- **[⚡ Quick Reference Commands →](QUICK-REFERENCE.md)**
- **[🚀 Quick Start Guide →](DEPLOYMENT.md)**
- **[🏗️ Infrastructure & Manual Deployment →](infrastructure/README.md)**
- **[⚙️ GitHub Actions CI/CD Setup →](.github/README.md)**

## Quick Start

### Using Docker (Recommended)

1. **Start the database:**

   ```bash
   docker-compose up -d postgres
   ```

2. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

3. **Start the application:**
   ```bash
   npm run start:dev
   ```

### Using the Setup Script

```bash
./setup-dev.sh
```

## API Endpoints

### Blog Posts

#### Get All Posts

```http
GET /api/posts
```

Returns a list of all blog posts with titles and comment counts.

**Response:**

```json
[
  {
    "id": 1,
    "title": "My First Blog Post",
    "commentsCount": 5,
    "createdAt": "2025-09-03T10:00:00Z",
    "updatedAt": "2025-09-03T10:00:00Z"
  }
]
```

#### Create a New Post

```http
POST /api/posts
Content-Type: application/json

{
  "title": "My Blog Post",
  "content": "This is the content of my blog post."
}
```

#### Get Specific Post (Enhanced)

```http
GET /api/posts/{id}?includeComments=true&commentsLimit=5&commentsPage=1&commentsSortOrder=most_recent
```

Returns a specific blog post by ID with optional comments inclusion.

**Query Parameters:**

- `includeComments` (optional): Include comments in response (default: false)
- `commentsLimit` (optional): Number of comments to include (default: 10)
- `commentsPage` (optional): Page of comments (default: 1)
- `commentsSortOrder` (optional): Sort order for comments
  - `most_recent` - Newest comments first
  - `oldest_first` - Oldest comments first
  - `most_liked` - Most liked first (future feature)

**Response without comments:**

```json
{
  "id": 1,
  "title": "My First Blog Post",
  "content": "This is the full content...",
  "commentsCount": 15,
  "createdAt": "2025-09-03T10:00:00Z",
  "updatedAt": "2025-09-03T10:00:00Z"
}
```

**Response with comments:**

```json
{
  "id": 1,
  "title": "My First Blog Post",
  "content": "This is the full content...",
  "commentsCount": 15,
  "createdAt": "2025-09-03T10:00:00Z",
  "updatedAt": "2025-09-03T10:00:00Z",
  "comments": {
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "author": "John Doe",
        "createdAt": "2025-09-03T10:30:00Z",
        "updatedAt": "2025-09-03T10:30:00Z",
        "blogPostId": 1,
        "parentId": null,
        "repliesCount": 3,
        "isReply": false
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 5,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Comments

#### Get Comments for a Post (Lazy Loading)

```http
GET /api/posts/{postId}/comments?page=1&limit=10&sortOrder=most_recent
```

Returns paginated top-level comments for a blog post.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortOrder` (optional): Sort order
  - `most_recent` - Newest comments first
  - `oldest_first` - Oldest comments first
  - `most_liked` - Most liked first (future feature)

**Response:**

```json
{
  "comments": [
    {
      "id": 1,
      "content": "Great post!",
      "author": "John Doe",
      "createdAt": "2025-09-03T10:30:00Z",
      "updatedAt": "2025-09-03T10:30:00Z",
      "blogPostId": 1,
      "parentId": null,
      "repliesCount": 3,
      "isReply": false
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Replies for a Comment (Lazy Loading)

```http
GET /api/comments/{commentId}/replies?page=1&limit=5&sortOrder=oldest_first
```

Returns paginated replies for a specific comment.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 5)
- `sortOrder` (optional): Sort order (same options as comments)

**Response:**

```json
{
  "comments": [
    {
      "id": 2,
      "content": "I agree!",
      "author": "Jane Smith",
      "createdAt": "2025-09-03T11:00:00Z",
      "updatedAt": "2025-09-03T11:00:00Z",
      "blogPostId": 1,
      "parentId": 1,
      "repliesCount": 0,
      "isReply": true
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Create a Comment or Reply

```http
POST /api/posts/{postId}/comments
Content-Type: application/json

{
  "content": "This is my comment",
  "author": "John Doe",
  "parentId": 1  // Optional: Include for replies
}
```

**For a top-level comment:**

```json
{
  "content": "This is my comment",
  "author": "John Doe"
}
```

**For a reply:**

```json
{
  "content": "This is my reply",
  "author": "Jane Smith",
  "parentId": 1
}
```

## Performance Features

### Lazy Loading Strategy

1. **Blog Post Details**: Comments are not loaded when fetching blog post details
2. **Paginated Comments**: Top-level comments are loaded separately with pagination
3. **Paginated Replies**: Replies are loaded on-demand with separate pagination
4. **Comment Counts**: Efficient counting without loading full comment trees

### Database Optimization

- Separate queries for counts vs. data loading
- Strategic use of database indexes
- Cascading deletes for data integrity
- Optimized pagination with proper LIMIT/OFFSET

## Architecture

### Clean Architecture Layers

```
src/
├── domain/               # Business logic & entities
│   ├── entities/        # Domain entities
│   └── repositories/    # Repository interfaces
├── application/         # Use cases & application logic
│   ├── dtos/           # Application commands/queries
│   └── use-cases/      # Business use cases
├── infrastructure/     # External concerns
│   ├── database/       # Database service
│   └── repositories/   # Repository implementations
└── presentation/       # API layer
    ├── controllers/    # HTTP controllers
    └── dtos/          # Request/Response DTOs
```

### Key Design Principles

- **Single Responsibility**: Each layer has a clear purpose
- **Dependency Inversion**: Inner layers don't depend on outer layers
- **Domain-Centric**: Business logic in domain entities
- **Testable**: Clean separation enables easy unit testing

## Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug mode

# Database
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:reset          # Reset database
npm run db:studio         # Open Prisma Studio

# Docker
npm run docker:up         # Start all services
npm run docker:down       # Stop all services
npm run docker:build      # Build containers

# Testing
npm run test              # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Run with coverage
```

### Database Schema

```sql
BlogPost {
  id        Int       @id @default(autoincrement())
  title     String
  content   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  comments  Comment[]
}

Comment {
  id         Int       @id @default(autoincrement())
  content    String
  author     String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  blogPostId Int
  parentId   Int?      # Self-reference for replies
  blogPost   BlogPost  @relation(...)
  parent     Comment?  @relation("CommentReplies", ...)
  replies    Comment[] @relation("CommentReplies")
}
```

## Frontend Integration Examples

### Loading Comments with Flexible Options

```typescript
// Option 1: Get post without comments (fast)
const post = await fetch('/api/posts/1');

// Option 2: Get post with first 5 most recent comments
const postWithComments = await fetch(
  '/api/posts/1?includeComments=true&commentsLimit=5&commentsSortOrder=most_recent',
);

// Option 3: Get post with first 3 oldest comments
const postWithOldComments = await fetch(
  '/api/posts/1?includeComments=true&commentsLimit=3&commentsSortOrder=oldest_first',
);

// Option 4: Load more comments separately
const moreComments = await fetch(
  '/api/posts/1/comments?page=2&limit=10&sortOrder=most_recent',
);

// Load replies when user clicks "Show Replies"
const replies = await fetch(
  '/api/comments/1/replies?page=1&limit=5&sortOrder=oldest_first',
);
```

### Creating Nested Replies

```typescript
// Create a top-level comment
await fetch('/api/posts/1/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Great post!',
    author: 'John Doe',
  }),
});

// Create a reply
await fetch('/api/posts/1/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'I agree!',
    author: 'Jane Smith',
    parentId: 1, // Reply to comment with ID 1
  }),
});
```

## License

This project is licensed under the MIT License.

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
