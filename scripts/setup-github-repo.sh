#!/bin/bash

# GitHub Repository Setup Script
# This script helps create and configure the blog-api GitHub repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  GitHub Repository Setup: blog-api${NC}"
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

# Check if we're in the right directory
check_project_directory() {
    if [ ! -f "package.json" ] || [ ! -d "src" ] || [ ! -d "infrastructure" ]; then
        print_error "This doesn't appear to be the blog-api project directory"
        echo "Please run this script from the project root directory"
        exit 1
    fi
    print_status "Project directory confirmed"
}

# Check if git is initialized
check_git_status() {
    if [ ! -d ".git" ]; then
        print_status "Initializing git repository..."
        git init
    else
        print_status "Git repository already initialized"
    fi
    
    # Check if there are any commits
    if ! git rev-parse HEAD >/dev/null 2>&1; then
        print_status "No commits found, will create initial commit"
        NEED_INITIAL_COMMIT=true
    else
        print_status "Git repository has commits"
        NEED_INITIAL_COMMIT=false
    fi
}

# Get GitHub username
get_github_username() {
    # Try to get from git config first
    GIT_USERNAME=$(git config --get user.name 2>/dev/null || echo "")
    
    if [ -n "$GIT_USERNAME" ]; then
        print_status "Found git username: $GIT_USERNAME"
        read -p "Use '$GIT_USERNAME' as GitHub username? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            read -p "Enter your GitHub username: " GITHUB_USERNAME
        else
            GITHUB_USERNAME="$GIT_USERNAME"
        fi
    else
        read -p "Enter your GitHub username: " GITHUB_USERNAME
    fi
    
    export GITHUB_USERNAME
}

# Check if GitHub CLI is available
check_github_cli() {
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            print_status "GitHub CLI is available and authenticated"
            return 0
        else
            print_warning "GitHub CLI found but not authenticated"
            echo "Please run: gh auth login"
            return 1
        fi
    else
        print_warning "GitHub CLI not found"
        echo "Install from: https://cli.github.com/"
        return 1
    fi
}

# Create repository via GitHub CLI
create_repo_with_cli() {
    print_status "Creating repository 'blog-api' via GitHub CLI..."
    
    DESCRIPTION="A RESTful API for managing a blogging platform with hierarchical comments, built with NestJS, Prisma ORM, PostgreSQL, and Clean Architecture principles."
    
    # Create repository
    gh repo create blog-api \
        --public \
        --description "$DESCRIPTION" \
        --source . \
        --push
    
    print_status "Repository created and code pushed successfully!"
    return 0
}

# Manual repository creation instructions
show_manual_instructions() {
    print_warning "Manual repository creation required"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: blog-api"
    echo "3. Description: A RESTful API for managing a blogging platform with hierarchical comments"
    echo "4. Choose Public or Private"
    echo "5. DO NOT initialize with README, .gitignore, or license"
    echo "6. Click 'Create repository'"
    echo ""
    echo "Then run these commands:"
    echo "----------------------------------------"
    echo "git remote add origin https://github.com/$GITHUB_USERNAME/blog-api.git"
    echo "git push -u origin main"
    echo "----------------------------------------"
    echo ""
}

# Add files and create initial commit
prepare_initial_commit() {
    if [ "$NEED_INITIAL_COMMIT" = true ]; then
        print_status "Preparing initial commit..."
        
        # Add all files
        git add .
        
        # Create initial commit
        git commit -m "Initial commit: NestJS Blog API with Infrastructure as Code

Features:
- Blog posts and hierarchical comments management
- Redis caching for optimal performance
- Clean architecture with domain-driven design
- E2E testing with isolated test database
- Infrastructure as Code for VPS deployment
- GitHub Actions CI/CD pipelines
- Security hardening and SSL automation
- Health monitoring and automated backups"
        
        print_status "Initial commit created"
    else
        print_status "Repository already has commits"
    fi
}

# Setup remote and push
setup_remote_and_push() {
    # Check if origin remote exists
    if git remote get-url origin >/dev/null 2>&1; then
        CURRENT_ORIGIN=$(git remote get-url origin)
        print_status "Current origin: $CURRENT_ORIGIN"
        
        if [[ "$CURRENT_ORIGIN" == *"blog-api"* ]]; then
            print_status "Origin already points to blog-api repository"
        else
            print_warning "Origin points to different repository"
            read -p "Update origin to blog-api? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git remote set-url origin "https://github.com/$GITHUB_USERNAME/blog-api.git"
                print_status "Origin updated to blog-api repository"
            fi
        fi
    else
        print_status "Adding origin remote..."
        git remote add origin "https://github.com/$GITHUB_USERNAME/blog-api.git"
    fi
    
    # Push to main branch
    print_status "Pushing to main branch..."
    git push -u origin main
}

# Create and push develop branch
setup_develop_branch() {
    print_status "Setting up develop branch for CI/CD..."
    
    # Check if develop branch exists locally
    if git show-ref --verify --quiet refs/heads/develop; then
        print_status "Develop branch already exists locally"
    else
        print_status "Creating develop branch..."
        git checkout -b develop
        git push -u origin develop
    fi
    
    # Switch back to main
    git checkout main
    print_status "Switched back to main branch"
}

# Update repository-specific files
update_repository_files() {
    print_status "Updating repository-specific files..."
    
    # Update workflow status badges in .github/WORKFLOWS.md
    if [ -f ".github/WORKFLOWS.md" ]; then
        sed -i.bak "s/YOUR_USERNAME/$GITHUB_USERNAME/g" .github/WORKFLOWS.md
        sed -i.bak "s/YOUR_REPO/blog-api/g" .github/WORKFLOWS.md
        rm -f .github/WORKFLOWS.md.bak
        print_status "Updated .github/WORKFLOWS.md"
    fi
    
    # Update other files that might reference the repository
    if [ -f "DEPLOYMENT-GUIDE.md" ]; then
        sed -i.bak "s/yourusername\/your-repo/$GITHUB_USERNAME\/blog-api/g" DEPLOYMENT-GUIDE.md
        sed -i.bak "s/username\/repo/$GITHUB_USERNAME\/blog-api/g" DEPLOYMENT-GUIDE.md
        rm -f DEPLOYMENT-GUIDE.md.bak
        print_status "Updated DEPLOYMENT-GUIDE.md"
    fi
    
    # Commit the updates
    if git diff --quiet; then
        print_status "No file updates needed"
    else
        git add .
        git commit -m "Update repository references to blog-api"
        git push origin main
        print_status "Repository references updated and pushed"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Repository Setup Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Your blog-api repository is now available at:"
    echo "🔗 https://github.com/$GITHUB_USERNAME/blog-api"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. 🔧 Configure GitHub Actions (if you want CI/CD):"
    echo "   npm run ci:setup"
    echo ""
    echo "2. 🚀 Deploy to production:"
    echo "   ./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP"
    echo ""
    echo "3. 📖 Read the documentation:"
    echo "   - Complete Guide: DEPLOYMENT-GUIDE.md"
    echo "   - Quick Reference: QUICK-REFERENCE.md"
    echo "   - Checklist: CHECKLIST.md"
    echo ""
    echo "4. 🎯 Start developing:"
    echo "   git checkout develop"
    echo "   git checkout -b feature/your-feature"
    echo ""
    echo "Repository structure:"
    echo "- main branch: Production-ready code"
    echo "- develop branch: Integration branch for features"
    echo "- feature/* branches: New feature development"
}

# Main execution flow
main() {
    print_header
    
    check_project_directory
    echo ""
    
    check_git_status
    echo ""
    
    get_github_username
    echo ""
    
    prepare_initial_commit
    echo ""
    
    if check_github_cli; then
        echo ""
        if create_repo_with_cli; then
            setup_develop_branch
        else
            print_error "Failed to create repository via GitHub CLI"
            show_manual_instructions
            return 1
        fi
    else
        show_manual_instructions
        echo ""
        read -p "Press Enter after creating the repository on GitHub..."
        setup_remote_and_push
        setup_develop_branch
    fi
    
    echo ""
    update_repository_files
    
    echo ""
    show_next_steps
}

# Run main function
main "$@"
