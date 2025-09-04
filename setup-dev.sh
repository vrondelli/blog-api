#!/bin/bash

# Development setup script for the Blog Platform

echo "🚀 Starting Blog Platform Development Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start the database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma migrate dev --name init

# Seed the database (optional)
echo "🌱 Seeding database with sample data..."
npx prisma db seed 2>/dev/null || echo "No seed script found, skipping..."

echo "✅ Development setup complete!"
echo ""
echo "📋 Next steps:"
echo "   • Run 'pnpm run start:dev' to start the development server"
echo "   • Or run 'docker-compose up' to start everything with Docker"
echo "   • Access the API at http://localhost:3000"
echo ""
echo "🔗 Available endpoints:"
echo "   • GET    /api/posts           - Get all blog posts"
echo "   • POST   /api/posts           - Create a new blog post"
echo "   • GET    /api/posts/:id       - Get a specific blog post"
echo "   • POST   /api/posts/:id/comments - Add a comment to a blog post"
