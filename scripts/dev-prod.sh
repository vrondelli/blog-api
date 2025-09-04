#!/bin/bash

# Local development with production-like environment
# Usage: ./dev-prod.sh [action]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ACTION=${1:-up}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to project root
cd "$(dirname "$0")/.."

case $ACTION in
    up|start)
        print_status "Starting production-like development environment..."
        
        # Create .env file if it doesn't exist
        if [ ! -f .env ]; then
            print_warning ".env file not found. Creating from .env.example..."
            cp .env.example .env
        fi
        
        # Start services
        docker-compose -f docker-compose.prod.yml up -d --build
        
        print_status "Services starting up..."
        sleep 10
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        until docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U blog_user -d blog_db; do
            sleep 2
        done
        
        # Run migrations
        print_status "Running database migrations..."
        docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy
        
        print_status "Development environment is ready!"
        echo ""
        echo "Services:"
        echo "  Application: http://localhost (via Nginx)"
        echo "  API Direct:  http://localhost:3000"
        echo "  Database:    localhost:5432"
        echo "  Redis:       localhost:6379"
        echo ""
        echo "Commands:"
        echo "  View logs:   docker-compose -f docker-compose.prod.yml logs -f"
        echo "  Stop:        ./dev-prod.sh down"
        echo "  Restart:     ./dev-prod.sh restart"
        ;;
        
    down|stop)
        print_status "Stopping development environment..."
        docker-compose -f docker-compose.prod.yml down
        print_status "Environment stopped."
        ;;
        
    restart)
        print_status "Restarting development environment..."
        docker-compose -f docker-compose.prod.yml restart
        print_status "Environment restarted."
        ;;
        
    logs)
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
        
    build)
        print_status "Rebuilding application..."
        docker-compose -f docker-compose.prod.yml build --no-cache app
        print_status "Build completed."
        ;;
        
    clean)
        print_status "Cleaning up development environment..."
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        print_status "Cleanup completed."
        ;;
        
    shell)
        docker-compose -f docker-compose.prod.yml exec app sh
        ;;
        
    db)
        docker-compose -f docker-compose.prod.yml exec postgres psql -U blog_user -d blog_db
        ;;
        
    redis)
        docker-compose -f docker-compose.prod.yml exec redis redis-cli
        ;;
        
    *)
        echo "Usage: $0 {up|down|restart|logs|build|clean|shell|db|redis}"
        echo ""
        echo "Commands:"
        echo "  up       - Start the development environment"
        echo "  down     - Stop the development environment"
        echo "  restart  - Restart all services"
        echo "  logs     - Show logs from all services"
        echo "  build    - Rebuild the application container"
        echo "  clean    - Stop and remove all containers and volumes"
        echo "  shell    - Open shell in application container"
        echo "  db       - Open PostgreSQL shell"
        echo "  redis    - Open Redis CLI"
        exit 1
        ;;
esac
