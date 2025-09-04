#!/bin/bash

# Update NestJS Application on VPS
# Usage: ./update.sh [environment] [domain] [vps-ip] [git-branch]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
DOMAIN=${2}
VPS_IP=${3}
GIT_BRANCH=${4:-main}
GIT_REPO_URL=${5:-$(git remote get-url origin 2>/dev/null || "")}

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
    echo "Usage: $0 [environment] <domain> <vps-ip> [git-branch] [git-repo-url]"
    echo "Example: $0 production example.com 1.2.3.4 main"
    exit 1
fi

if [ -z "$VPS_IP" ]; then
    print_error "VPS IP is required!"
    echo "Usage: $0 [environment] <domain> <vps-ip> [git-branch] [git-repo-url]"
    echo "Example: $0 production example.com 1.2.3.4 main"
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

# Create temporary inventory file
TEMP_INVENTORY=$(mktemp)
cat > "$TEMP_INVENTORY" << EOF
all:
  children:
    $ENVIRONMENT:
      hosts:
        ${ENVIRONMENT}-server:
          ansible_host: $VPS_IP
          ansible_user: root
          ansible_ssh_private_key_file: ~/.ssh/id_rsa
          domain_name: $DOMAIN
          git_repo_url: $GIT_REPO_URL
          git_branch: $GIT_BRANCH
          
  vars:
    app_name: nestjs-blog-api
    app_port: 3000
    app_user: deploy
    app_dir: /opt/nestjs-blog-api
    postgres_db: blog_db
    postgres_user: blog_user
    use_ssl: true
EOF

print_status "Testing connection to VPS..."
if ! ansible all -i "$TEMP_INVENTORY" -m ping; then
    print_error "Cannot connect to VPS!"
    rm "$TEMP_INVENTORY"
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

# Run the update playbook
ansible-playbook -i "$TEMP_INVENTORY" playbooks/update.yml

# Clean up
rm "$TEMP_INVENTORY"

print_status "Update completed successfully!"
print_status "Application is available at: https://$DOMAIN"

echo ""
echo "Post-update checks:"
echo "1. Check application health: curl https://$DOMAIN/health"
echo "2. Monitor logs: ssh root@$VPS_IP 'docker logs nestjs-app'"
echo "3. Check database: ssh root@$VPS_IP 'docker exec postgres-db psql -U blog_user -d blog_db -c \"\\dt\"'"
