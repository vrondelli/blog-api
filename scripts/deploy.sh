#!/bin/bash

# Deploy NestJS Application to VPS
# Usage: ./deploy.sh [environment] [domain] [vps-ip]

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
GIT_REPO_URL=${4:-$(git remote get-url origin 2>/dev/null || "")}

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
    echo "Usage: $0 [environment] <domain> <vps-ip> [git-repo-url]"
    echo "Example: $0 production example.com 1.2.3.4"
    exit 1
fi

if [ -z "$VPS_IP" ]; then
    print_error "VPS IP is required!"
    echo "Usage: $0 [environment] <domain> <vps-ip> [git-repo-url]"
    echo "Example: $0 production example.com 1.2.3.4"
    exit 1
fi

# Check if Ansible is installed
if ! command -v ansible &> /dev/null; then
    print_error "Ansible is not installed!"
    echo "Please install Ansible: pip install ansible"
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment..."
print_status "Domain: $DOMAIN"
print_status "VPS IP: $VPS_IP"
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
          ssl_email: admin@$DOMAIN
          git_repo_url: $GIT_REPO_URL
          git_branch: main
          
  vars:
    app_name: nestjs-blog-api
    app_port: 3000
    app_user: deploy
    app_dir: /opt/nestjs-blog-api
    postgres_db: blog_db
    postgres_user: blog_user
    postgres_version: "15"
    redis_port: 6379
    docker_compose_version: "2.21.0"
    use_ssl: true
    ssl_provider: letsencrypt
EOF

print_status "Testing connection to VPS..."
if ! ansible all -i "$TEMP_INVENTORY" -m ping; then
    print_error "Cannot connect to VPS! Please check:"
    echo "  1. VPS IP address is correct"
    echo "  2. SSH key is properly configured"
    echo "  3. Root access is available"
    rm "$TEMP_INVENTORY"
    exit 1
fi

print_status "Connection successful! Starting deployment..."

# Run the deployment playbook
ansible-playbook -i "$TEMP_INVENTORY" playbooks/deploy.yml

# Clean up
rm "$TEMP_INVENTORY"

print_status "Deployment completed successfully!"
print_status "Your application should be available at: https://$DOMAIN"
print_warning "Please save the generated passwords displayed above!"
print_warning "It may take a few minutes for SSL certificates to be generated."

echo ""
echo "Next steps:"
echo "1. Point your domain DNS to: $VPS_IP"
echo "2. Wait for DNS propagation (up to 24 hours)"
echo "3. Monitor logs: ssh root@$VPS_IP 'docker logs nestjs-app'"
echo "4. Update application: ./update.sh $ENVIRONMENT $DOMAIN $VPS_IP"
