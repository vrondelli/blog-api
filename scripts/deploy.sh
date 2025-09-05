#!/bin/bash

# Deploy NestJS Application to VPS
# Usage: ./deploy.sh [environment] [domain] [vps-ip] [git-repo-url]
#   OR:  ./deploy.sh --env-file [path-to-.env-file]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if using environment file
if [[ "$1" == "--env-file" ]]; then
    ENV_FILE="${2:-infrastructure/ansible/.env}"
    if [[ -f "$ENV_FILE" ]]; then
        print_status "Loading environment from: $ENV_FILE"
        # Load environment variables from .env file
        set -a
        source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
        set +a
        
        # Use environment variables
        ENVIRONMENT=${ENVIRONMENT:-production}
        DOMAIN=${DOMAIN_NAME}
        VPS_IP=${VPS_HOST}
        GIT_REPO_URL=${GIT_REPO_URL}
        SSH_KEY_FILE=${SSH_PRIVATE_KEY_FILE}
        EMAIL=${SSL_EMAIL}
    else
        print_error "Environment file not found: $ENV_FILE"
        echo "Create it from template: cp infrastructure/ansible/.env.template infrastructure/ansible/.env"
        exit 1
    fi
else
    # Use command line arguments
    ENVIRONMENT=${1:-production}
    DOMAIN=${2}
    VPS_IP=${3}
    GIT_REPO_URL=${4:-$(git remote get-url origin 2>/dev/null || "")}
    SSH_KEY_FILE=${SSH_PRIVATE_KEY_FILE:-"~/.ssh/blog_api_deploy"}
    EMAIL=${SSL_EMAIL:-"admin@${DOMAIN}"}
fi

# Validate inputs
if [ -z "$DOMAIN" ]; then
    print_error "Domain is required!"
    echo ""
    echo "Usage Options:"
    echo "  1. Command line: $0 [environment] <domain> <vps-ip> [git-repo-url]"
    echo "     Example: $0 production example.com 1.2.3.4"
    echo ""
    echo "  2. Environment file: $0 --env-file [path-to-.env-file]"
    echo "     Example: $0 --env-file infrastructure/ansible/.env"
    echo ""
    echo "  3. Create .env file from template:"
    echo "     cp infrastructure/ansible/.env.template infrastructure/ansible/.env"
    exit 1
fi

if [ -z "$VPS_IP" ]; then
    print_error "VPS IP is required!"
    echo ""
    echo "Usage Options:"
    echo "  1. Command line: $0 [environment] <domain> <vps-ip> [git-repo-url]"
    echo "     Example: $0 production example.com 1.2.3.4"
    echo ""
    echo "  2. Environment file: $0 --env-file [path-to-.env-file]"
    echo "     Example: $0 --env-file infrastructure/ansible/.env"
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

# Set environment variables for Ansible
export VPS_HOST="$VPS_IP"
export VPS_USER="root"
export SSH_PRIVATE_KEY_FILE="$SSH_KEY_FILE"
export DOMAIN_NAME="$DOMAIN"
export SSL_EMAIL="$EMAIL"
export GIT_REPO_URL="$GIT_REPO_URL"
export GIT_BRANCH="main"
export ENVIRONMENT="$ENVIRONMENT"

print_status "Environment variables set:"
print_status "  VPS_HOST: $VPS_HOST"
print_status "  DOMAIN_NAME: $DOMAIN_NAME"
print_status "  SSH_PRIVATE_KEY_FILE: $SSH_PRIVATE_KEY_FILE"
print_status "  SSL_EMAIL: $SSL_EMAIL"
print_status "  GIT_REPO_URL: $GIT_REPO_URL"
print_status "  ENVIRONMENT: $ENVIRONMENT"

print_status "Testing connection to VPS..."
if ! ansible all -i inventory/hosts.yml -m ping; then
    print_error "Cannot connect to VPS! Please check:"
    echo "  1. VPS IP address is correct: $VPS_HOST"
    echo "  2. SSH key is properly configured: $SSH_PRIVATE_KEY_FILE"
    echo "  3. Root access is available"
    echo "  4. SSH key has been copied to VPS"
    exit 1
fi

print_status "Connection successful! Starting deployment..."

# Run the deployment playbook with environment variables
ANSIBLE_ROLES_PATH=./roles ansible-playbook -i inventory/hosts.yml playbooks/deploy.yml

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
