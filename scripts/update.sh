#!/bin/bash

# Update NestJS Application on VPS
# Usage: ./update.sh [environment] [domain] [vps-ip] [git-branch] [git-repo-url]
#   OR:  ./update.sh --env-file [path-to-.env-file]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if using environment file
if [[ "$1" == "--env-file" ]]; then
    ENV_FILE="${2:-infrastructure/ansible/.env}"
    source "$(dirname "$0")/load-env.sh" "$ENV_FILE"
    
    # Use environment variables
    ENVIRONMENT=${ENVIRONMENT:-production}
    DOMAIN=${DOMAIN_NAME}
    VPS_IP=${VPS_HOST}
    GIT_BRANCH=${GIT_BRANCH:-main}
    GIT_REPO_URL=${GIT_REPO_URL}
else
    # Use command line arguments
    ENVIRONMENT=${1:-production}
    DOMAIN=${2}
    VPS_IP=${3}
    GIT_BRANCH=${4:-main}
    GIT_REPO_URL=${5:-$(git remote get-url origin 2>/dev/null || "")}
fi

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$DOMAIN" ]; then
    print_error "Domain is required!"
    echo ""
    echo "Usage Options:"
    echo "  1. Command line: $0 [environment] <domain> <vps-ip> [git-branch] [git-repo-url]"
    echo "     Example: $0 production example.com 1.2.3.4 main"
    echo ""
    echo "  2. Environment file: $0 --env-file [path-to-.env-file]"
    echo "     Example: $0 --env-file infrastructure/ansible/.env"
    exit 1
fi

if [ -z "$VPS_IP" ]; then
    print_error "VPS IP is required!"
    echo ""
    echo "Usage Options:"
    echo "  1. Command line: $0 [environment] <domain> <vps-ip> [git-branch] [git-repo-url]"
    echo "     Example: $0 production example.com 1.2.3.4 main"
    echo ""
    echo "  2. Environment file: $0 --env-file [path-to-.env-file]"
    echo "     Example: $0 --env-file infrastructure/ansible/.env"
    exit 1
fi

print_status "Starting application update..."
print_status "Environment: $ENVIRONMENT"
print_status "Domain: $DOMAIN"
print_status "VPS IP: $VPS_IP"
print_status "Git Branch: $GIT_BRANCH"
print_status "Git Repository: $GIT_REPO_URL"

# Navigate to infrastructure directory
cd "$(dirname "$0")/../infrastructure/ansible"

# Set environment variables for Ansible
export VPS_HOST="$VPS_IP"
export VPS_USER="root"
export SSH_PRIVATE_KEY_FILE="${SSH_PRIVATE_KEY_FILE}"
export DOMAIN_NAME="$DOMAIN"
export GIT_REPO_URL="$GIT_REPO_URL"
export GIT_BRANCH="$GIT_BRANCH"
export ENVIRONMENT="$ENVIRONMENT"

print_status "Environment variables set:"
print_status "  VPS_HOST: $VPS_HOST"
print_status "  DOMAIN_NAME: $DOMAIN_NAME"
print_status "  GIT_BRANCH: $GIT_BRANCH"
print_status "  ENVIRONMENT: $ENVIRONMENT"

print_status "Testing connection to VPS..."
if ! ansible all -i inventory/hosts.yml -m ping; then
    print_error "Cannot connect to VPS!"
    exit 1
fi

print_status "Connection successful! Starting update..."

# Ask for confirmation
read -p "This will update the application and restart services. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Update cancelled."
    rm "$TEMP_INVENTORY"
    exit 0
fi

# Run the update playbook with environment variables
ANSIBLE_ROLES_PATH=./roles ansible-playbook -i inventory/hosts.yml playbooks/update.yml

print_status "Update completed successfully!"
print_status "Application is available at: https://$DOMAIN"

echo ""
echo "Post-update checks:"
echo "1. Check application health: curl https://$DOMAIN/health"
echo "2. Monitor logs: ssh root@$VPS_IP 'docker logs nestjs-app'"
echo "3. Check database: ssh root@$VPS_IP 'docker exec postgres-db psql -U blog_user -d blog_db -c \"\\dt\"'"
