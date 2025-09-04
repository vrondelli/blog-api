#!/bin/bash

# Infrastructure Setup Script
# This script installs the necessary tools for deploying the NestJS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  NestJS Blog API - Infrastructure Setup${NC}"
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

# Check if running on supported OS
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    print_status "Detected OS: $OS"
}

# Install Ansible
install_ansible() {
    print_status "Installing Ansible..."
    
    if command -v ansible &> /dev/null; then
        print_warning "Ansible is already installed ($(ansible --version | head -n1))"
        return
    fi
    
    case $OS in
        debian)
            sudo apt update
            sudo apt install -y python3-pip python3-venv
            python3 -m pip install --user ansible
            ;;
        redhat)
            sudo dnf install -y python3-pip
            python3 -m pip install --user ansible
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install ansible
            else
                print_error "Homebrew not found. Please install Homebrew first or install Ansible manually."
                exit 1
            fi
            ;;
        *)
            print_error "Please install Ansible manually for your OS"
            exit 1
            ;;
    esac
    
    # Add local bin to PATH if needed
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    print_status "Ansible installation completed"
}

# Install Docker (for local development)
install_docker() {
    print_status "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        print_warning "Docker is already installed ($(docker --version))"
        return
    fi
    
    case $OS in
        debian)
            # Install Docker using the official script
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            rm get-docker.sh
            
            # Add user to docker group
            sudo usermod -aG docker $USER
            
            # Install Docker Compose
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            ;;
        redhat)
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            sudo systemctl enable --now docker
            sudo usermod -aG docker $USER
            ;;
        macos)
            print_warning "Please install Docker Desktop for Mac from https://docker.com/products/docker-desktop"
            print_warning "Skipping Docker installation on macOS"
            return
            ;;
    esac
    
    print_status "Docker installation completed"
    print_warning "Please log out and log back in for Docker group membership to take effect"
}

# Generate SSH key if needed
setup_ssh_key() {
    print_status "Checking SSH key setup..."
    
    if [ -f ~/.ssh/id_rsa ]; then
        print_warning "SSH key already exists at ~/.ssh/id_rsa"
    else
        print_status "Generating SSH key..."
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
        print_status "SSH key generated at ~/.ssh/id_rsa"
    fi
    
    echo ""
    print_status "Your public SSH key (copy this to your VPS):"
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa.pub
    echo "----------------------------------------"
    echo ""
}

# Verify installations
verify_installations() {
    print_status "Verifying installations..."
    
    # Check Ansible
    if command -v ansible &> /dev/null; then
        print_status "✓ Ansible: $(ansible --version | head -n1)"
    else
        print_error "✗ Ansible not found in PATH"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_status "✓ Docker: $(docker --version)"
    else
        print_warning "✗ Docker not found"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_status "✓ Docker Compose: $(docker-compose --version)"
    elif docker compose version &> /dev/null; then
        print_status "✓ Docker Compose (plugin): $(docker compose version)"
    else
        print_warning "✗ Docker Compose not found"
    fi
    
    # Check SSH key
    if [ -f ~/.ssh/id_rsa ]; then
        print_status "✓ SSH key exists"
    else
        print_warning "✗ SSH key not found"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Setup Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Copy your SSH public key to your VPS:"
    echo "   ssh-copy-id root@YOUR_VPS_IP"
    echo ""
    echo "2. Test SSH connection:"
    echo "   ssh root@YOUR_VPS_IP"
    echo ""
    echo "3. Deploy your application:"
    echo "   ./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP"
    echo ""
    echo "4. For local development:"
    echo "   ./scripts/dev-prod.sh up"
    echo ""
    echo "Documentation:"
    echo "  - Infrastructure: ./infrastructure/README.md"
    echo "  - Deployment: ./README.md"
    echo ""
    
    if [[ "$OS" == "debian" || "$OS" == "redhat" ]]; then
        print_warning "Please log out and log back in for Docker group membership to take effect"
    fi
}

# Main installation flow
main() {
    print_header
    
    check_os
    echo ""
    
    install_ansible
    echo ""
    
    install_docker
    echo ""
    
    setup_ssh_key
    echo ""
    
    verify_installations
    
    show_next_steps
}

# Run main function
main "$@"
