#!/bin/bash

# Setup SSL Certificate for NestJS Application
# Usage: ./ssl-setup.sh --env-file [path-to-.env-file]

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
    DOMAIN=${DOMAIN_NAME}
    VPS_IP=${VPS_HOST}
    VPS_USER=${VPS_USER}
    SSH_KEY=${SSH_PRIVATE_KEY_FILE}
else
    print_error "Please use --env-file option to specify environment file"
    exit 1
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
    exit 1
fi

if [ -z "$VPS_IP" ]; then
    print_error "VPS IP is required!"
    exit 1
fi

if [ -z "$VPS_USER" ]; then
    print_error "VPS User is required!"
    exit 1
fi

if [ -z "$SSH_KEY" ]; then
    print_error "SSH Key file is required!"
    exit 1
fi

print_status "Setting up SSL certificate for domain: $DOMAIN"
print_status "Target server: $VPS_IP"

# Change to ansible directory
cd "$(dirname "$0")/../infrastructure/ansible"

# Create temporary inventory file with environment variables
cat > temp_inventory << EOF
all:
  hosts:
    ssl-target:
      ansible_host: $VPS_IP
      ansible_user: $VPS_USER
      ansible_ssh_private_key_file: $SSH_KEY
EOF

print_status "Created temporary inventory file"

# Run the SSL setup playbook
print_status "Running SSL certificate setup..."
ansible-playbook -i temp_inventory playbooks/ssl-setup.yml

# Clean up temporary inventory
rm -f temp_inventory

print_status "SSL setup completed!"
