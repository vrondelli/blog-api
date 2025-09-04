#!/bin/bash

# GitHub Actions Setup Helper
# This script helps configure secrets and variables for GitHub Actions deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  GitHub Actions Setup Helper${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is installed
check_gh_cli() {
    if command -v gh &> /dev/null; then
        print_status "GitHub CLI found: $(gh --version | head -n1)"
        
        # Check if authenticated
        if gh auth status &> /dev/null; then
            print_status "GitHub CLI is authenticated"
            return 0
        else
            print_warning "GitHub CLI is not authenticated"
            echo "Please run: gh auth login"
            return 1
        fi
    else
        print_warning "GitHub CLI not found"
        echo "Install it from: https://cli.github.com/"
        echo "Or set secrets manually in GitHub web interface"
        return 1
    fi
}

# Generate SSH key if needed
setup_ssh_key() {
    print_status "Setting up SSH key for GitHub Actions..."
    
    SSH_KEY_PATH="$HOME/.ssh/github_actions_key"
    
    if [ -f "$SSH_KEY_PATH" ]; then
        print_warning "SSH key already exists at $SSH_KEY_PATH"
        read -p "Do you want to generate a new one? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    print_status "Generating new SSH key pair..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "github-actions-$(date +%Y%m%d)"
    
    echo ""
    print_status "SSH key generated successfully!"
    print_warning "IMPORTANT: Copy this public key to your VPS servers:"
    echo "----------------------------------------"
    cat "${SSH_KEY_PATH}.pub"
    echo "----------------------------------------"
    echo ""
    echo "Commands to run on your VPS:"
    echo "ssh-copy-id -i ${SSH_KEY_PATH}.pub root@YOUR_VPS_IP"
    echo ""
    
    # Store private key content for later use
    SSH_PRIVATE_KEY=$(cat "$SSH_KEY_PATH")
    export SSH_PRIVATE_KEY
}

# Collect configuration from user
collect_config() {
    print_status "Collecting deployment configuration..."
    echo ""
    
    # Production configuration
    echo -e "${BLUE}Production Environment:${NC}"
    read -p "Production VPS IP: " PRODUCTION_HOST
    read -p "Production SSH user [root]: " PRODUCTION_USER
    PRODUCTION_USER=${PRODUCTION_USER:-root}
    read -p "Production domain (e.g., api.yourdomain.com): " PRODUCTION_DOMAIN
    
    echo ""
    
    # Staging configuration (optional)
    echo -e "${BLUE}Staging Environment (optional):${NC}"
    read -p "Do you want to configure staging? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Staging VPS IP: " STAGING_HOST
        read -p "Staging SSH user [root]: " STAGING_USER
        STAGING_USER=${STAGING_USER:-root}
        read -p "Staging domain (e.g., staging-api.yourdomain.com): " STAGING_DOMAIN
    fi
    
    echo ""
    
    # SSL configuration
    echo -e "${BLUE}SSL Configuration:${NC}"
    read -p "Email for Let's Encrypt certificates: " SSL_EMAIL
    
    echo ""
    
    # Docker Hub (optional)
    echo -e "${BLUE}Docker Hub (optional):${NC}"
    read -p "Do you want to configure Docker Hub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Docker Hub username: " DOCKER_USERNAME
        read -s -p "Docker Hub password/token: " DOCKER_PASSWORD
        echo ""
    fi
    
    # Export variables for use in other functions
    export PRODUCTION_HOST PRODUCTION_USER PRODUCTION_DOMAIN
    export STAGING_HOST STAGING_USER STAGING_DOMAIN
    export SSL_EMAIL DOCKER_USERNAME DOCKER_PASSWORD
}

# Set GitHub secrets using CLI
set_github_secrets() {
    if ! check_gh_cli; then
        print_error "Cannot set secrets automatically. Please set them manually."
        show_manual_setup
        return 1
    fi
    
    print_status "Setting GitHub secrets..."
    
    # Required secrets
    echo "$SSH_PRIVATE_KEY" | gh secret set SSH_PRIVATE_KEY
    gh secret set PRODUCTION_HOST --body "$PRODUCTION_HOST"
    gh secret set PRODUCTION_USER --body "$PRODUCTION_USER" 
    gh secret set PRODUCTION_DOMAIN --body "$PRODUCTION_DOMAIN"
    gh secret set SSL_EMAIL --body "$SSL_EMAIL"
    
    # Optional staging secrets
    if [ -n "$STAGING_HOST" ]; then
        gh secret set STAGING_HOST --body "$STAGING_HOST"
        gh secret set STAGING_USER --body "$STAGING_USER"
        gh secret set STAGING_DOMAIN --body "$STAGING_DOMAIN"
    fi
    
    # Optional Docker secrets
    if [ -n "$DOCKER_USERNAME" ]; then
        gh secret set DOCKER_USERNAME --body "$DOCKER_USERNAME"
        gh secret set DOCKER_PASSWORD --body "$DOCKER_PASSWORD"
    fi
    
    print_status "Secrets set successfully!"
}

# Set GitHub variables
set_github_variables() {
    if ! check_gh_cli; then
        return 1
    fi
    
    print_status "Setting GitHub variables..."
    
    gh variable set PRODUCTION_DOMAIN --body "$PRODUCTION_DOMAIN"
    
    if [ -n "$STAGING_DOMAIN" ]; then
        gh variable set STAGING_DOMAIN --body "$STAGING_DOMAIN"
    fi
    
    print_status "Variables set successfully!"
}

# Show manual setup instructions
show_manual_setup() {
    echo ""
    print_warning "Manual Setup Required"
    echo "Please set the following secrets in GitHub:"
    echo "Repository → Settings → Secrets and variables → Actions"
    echo ""
    echo "Secrets to set:"
    echo "----------------------------------------"
    echo "SSH_PRIVATE_KEY:"
    echo "$SSH_PRIVATE_KEY"
    echo ""
    echo "PRODUCTION_HOST: $PRODUCTION_HOST"
    echo "PRODUCTION_USER: $PRODUCTION_USER"
    echo "PRODUCTION_DOMAIN: $PRODUCTION_DOMAIN"
    echo "SSL_EMAIL: $SSL_EMAIL"
    
    if [ -n "$STAGING_HOST" ]; then
        echo ""
        echo "STAGING_HOST: $STAGING_HOST"
        echo "STAGING_USER: $STAGING_USER"
        echo "STAGING_DOMAIN: $STAGING_DOMAIN"
    fi
    
    if [ -n "$DOCKER_USERNAME" ]; then
        echo ""
        echo "DOCKER_USERNAME: $DOCKER_USERNAME"
        echo "DOCKER_PASSWORD: [hidden]"
    fi
    
    echo "----------------------------------------"
    echo ""
    echo "Variables to set (in Variables tab):"
    echo "PRODUCTION_DOMAIN: $PRODUCTION_DOMAIN"
    if [ -n "$STAGING_DOMAIN" ]; then
        echo "STAGING_DOMAIN: $STAGING_DOMAIN"
    fi
}

# Create environment protection rules
setup_environments() {
    if ! check_gh_cli; then
        print_warning "Environment protection must be set up manually"
        echo "Go to: Repository → Settings → Environments"
        echo "Create: staging, production"
        echo "Add protection rules for production environment"
        return 1
    fi
    
    print_status "Environment protection setup must be done manually"
    print_warning "Please go to GitHub web interface to set up environment protection"
}

# Test SSH connections
test_connections() {
    print_status "Testing SSH connections..."
    
    SSH_KEY_PATH="$HOME/.ssh/github_actions_key"
    
    if [ -n "$PRODUCTION_HOST" ]; then
        echo "Testing production connection..."
        if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$PRODUCTION_USER@$PRODUCTION_HOST" "echo 'Connection successful'" 2>/dev/null; then
            print_status "✅ Production SSH connection successful"
        else
            print_error "❌ Production SSH connection failed"
            echo "Please run: ssh-copy-id -i ${SSH_KEY_PATH}.pub $PRODUCTION_USER@$PRODUCTION_HOST"
        fi
    fi
    
    if [ -n "$STAGING_HOST" ]; then
        echo "Testing staging connection..."
        if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$STAGING_USER@$STAGING_HOST" "echo 'Connection successful'" 2>/dev/null; then
            print_status "✅ Staging SSH connection successful"
        else
            print_error "❌ Staging SSH connection failed"
            echo "Please run: ssh-copy-id -i ${SSH_KEY_PATH}.pub $STAGING_USER@$STAGING_HOST"
        fi
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Setup Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Verify SSH connections work:"
    echo "   ssh -i ~/.ssh/github_actions_key $PRODUCTION_USER@$PRODUCTION_HOST"
    
    if [ -n "$STAGING_HOST" ]; then
        echo "   ssh -i ~/.ssh/github_actions_key $STAGING_USER@$STAGING_HOST"
    fi
    
    echo ""
    echo "2. Set up environment protection (manual):"
    echo "   - Go to: Repository → Settings → Environments"
    echo "   - Create environments: staging, production"
    echo "   - Add protection rules for production"
    echo ""
    echo "3. Test the deployment:"
    echo "   - Push to 'develop' branch → staging deployment"
    echo "   - Push to 'main' branch → production deployment"
    echo ""
    echo "4. Monitor deployments:"
    echo "   - GitHub Actions tab for workflow runs"
    echo "   - Issues tab for health check failures"
    echo ""
    echo "GitHub Actions documentation: .github/README.md"
}

# Main setup flow
main() {
    print_header
    
    setup_ssh_key
    echo ""
    
    collect_config
    echo ""
    
    set_github_secrets
    echo ""
    
    set_github_variables
    echo ""
    
    test_connections
    echo ""
    
    show_next_steps
}

# Run main function
main "$@"
