# 📖 Complete Deployment Guide

This comprehensive guide will walk you through deploying your NestJS Blog API from development to production, covering both manual deployment and automated CI/CD setup.

## 🎯 Overview

You have two deployment options:

1. **Manual Deployment** - Deploy directly to VPS using scripts
2. **Automated CI/CD** - Deploy using GitHub Actions (recommended for teams)

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **VPS Server** (DigitalOcean, Linode, Vultr, etc.)
  - Ubuntu 20.04+ or Debian 11+
  - Minimum: 1GB RAM, 1 CPU, 20GB storage
  - Root SSH access
- [ ] **Domain Name** (optional but recommended)
  - Purchased from registrar (Namecheap, GoDaddy, etc.)
  - DNS management access
- [ ] **Local Development Environment**
  - Git installed
  - SSH client
  - Node.js 18+ (for local testing)

---

## 🚀 Option 1: Manual Deployment (Quick Start)

Perfect for personal projects or quick deployment.

### Step 1: Prepare Your VPS

#### 1.1. Create VPS Instance

Choose your provider and create a server:

**DigitalOcean Example:**

```bash
# Create droplet via web interface
# - Ubuntu 20.04 LTS
# - Basic plan ($5/month)
# - Add your SSH key
# - Choose datacenter region
```

**Other Providers:**

- **Linode**: Create Nanode ($5/month)
- **Vultr**: Regular Performance ($5/month)
- **Hetzner**: CX11 (~$3/month)

#### 1.2. Configure Domain (Optional)

```bash
# Add DNS records at your domain registrar
# Type: A Record
# Name: @ (or your subdomain)
# Value: YOUR_VPS_IP
# TTL: 300 (5 minutes)

# For API subdomain:
# Name: api
# Value: YOUR_VPS_IP
```

#### 1.3. Test VPS Access

```bash
# Test SSH connection
ssh root@YOUR_VPS_IP

# If using SSH key
ssh -i ~/.ssh/your_key root@YOUR_VPS_IP
```

### Step 2: Clone and Setup Project

#### 2.1. Clone Repository

```bash
# Clone your repository locally
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Or if already cloned, pull latest changes
git pull origin main
```

#### 2.2. Install Prerequisites

```bash
# Run the setup script to install Ansible, Docker, etc.
./scripts/setup.sh

# Follow the prompts to:
# - Install Ansible
# - Install Docker (for local testing)
# - Generate SSH keys
# - Configure system
```

#### 2.3. Copy SSH Key to VPS

```bash
# Copy the generated SSH key to your VPS
ssh-copy-id root@YOUR_VPS_IP

# Or if using custom key
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_VPS_IP

# Test the connection
ssh root@YOUR_VPS_IP
```

### Step 3: Deploy Application

#### 3.1. Run Deployment Script

```bash
# Basic deployment with IP address
./scripts/deploy.sh production YOUR_DOMAIN YOUR_VPS_IP

# Example:
./scripts/deploy.sh production api.yourdomain.com 134.122.123.45

# With custom Git repository
./scripts/deploy.sh production api.yourdomain.com 134.122.123.45 https://github.com/yourusername/your-repo.git
```

#### 3.2. Monitor Deployment

The script will:

1. ✅ Test VPS connection
2. ✅ Install system packages and security
3. ✅ Install Docker and dependencies
4. ✅ Clone your application
5. ✅ Build Docker containers
6. ✅ Configure Nginx with SSL
7. ✅ Start all services
8. ✅ Run database migrations

#### 3.3. Verify Deployment

```bash
# Check if application is running
curl https://yourdomain.com/health

# Check API endpoints
curl https://yourdomain.com/api

# SSH into server to check logs
ssh root@YOUR_VPS_IP
docker logs nestjs-app
```

### Step 4: Update Application

#### 4.1. Update Code

```bash
# When you have new code to deploy
./scripts/update.sh production yourdomain.com YOUR_VPS_IP

# Or update from specific branch
./scripts/update.sh production yourdomain.com YOUR_VPS_IP develop
```

#### 4.2. Database Operations

```bash
# SSH into server for database operations
ssh root@YOUR_VPS_IP
cd /opt/nestjs-blog-api

# Run migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed database
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed

# Access database
docker-compose -f docker-compose.prod.yml exec postgres psql -U blog_user -d blog_db
```

---

## ⚡ Option 2: Automated CI/CD with GitHub Actions

Recommended for teams and production workflows.

### Step 1: Prepare GitHub Repository

#### 1.1. Fork or Create Repository

```bash
# If forking this repository
# Click "Fork" on GitHub

# If creating new repository
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

#### 1.2. Create Development Branch

```bash
# Create develop branch for staging deployments
git checkout -b develop
git push -u origin develop
```

### Step 2: Setup VPS Servers

#### 2.1. Create Production Server

Follow Step 1 from Manual Deployment to create your production VPS.

#### 2.2. Create Staging Server (Optional)

```bash
# Create a second VPS for staging
# - Smaller size is fine (512MB RAM)
# - Same OS (Ubuntu 20.04+)
# - Different IP address
```

#### 2.3. Setup SSH Access

```bash
# Generate SSH key specifically for GitHub Actions
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions_key -N ""

# Copy to both servers
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@PRODUCTION_VPS_IP
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@STAGING_VPS_IP
```

### Step 3: Configure GitHub Actions

#### 3.1. Run Setup Script

```bash
# Run the interactive setup script
npm run ci:setup

# This will:
# - Generate SSH keys
# - Collect server information
# - Set GitHub secrets automatically
# - Test connections
```

#### 3.2. Manual Secret Configuration (Alternative)

If the script doesn't work, set secrets manually:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

**Required Secrets:**

```bash
SSH_PRIVATE_KEY          # Content of ~/.ssh/github_actions_key
PRODUCTION_HOST          # Production VPS IP
PRODUCTION_USER          # root (or deploy user)
PRODUCTION_DOMAIN        # yourdomain.com
SSL_EMAIL                # your-email@domain.com

# Optional - for staging
STAGING_HOST            # Staging VPS IP
STAGING_USER            # root (or deploy user)
STAGING_DOMAIN          # staging.yourdomain.com

# Optional - for Docker Hub
DOCKER_USERNAME         # Docker Hub username
DOCKER_PASSWORD         # Docker Hub token
```

**Required Variables:**
Go to Variables tab and add:

```bash
PRODUCTION_DOMAIN       # yourdomain.com
STAGING_DOMAIN          # staging.yourdomain.com (if using staging)
```

#### 3.3. Setup Environment Protection

1. Go to Settings → Environments
2. Create environments:
   - `staging`
   - `production`
3. For production environment:
   - ✅ Add "Required reviewers" (yourself)
   - ✅ Set "Deployment branches" to `main` only
   - ✅ Add wait timer (optional)

### Step 4: Initial Deployment

#### 4.1. Manual Initial Setup

First deployment should be manual to ensure everything works:

```bash
# Deploy to staging first
./scripts/deploy.sh staging staging.yourdomain.com STAGING_VPS_IP

# Then deploy to production
./scripts/deploy.sh production yourdomain.com PRODUCTION_VPS_IP
```

#### 4.2. Test GitHub Actions

```bash
# Test staging deployment
git checkout develop
echo "# Test change" >> README.md
git add README.md
git commit -m "Test staging deployment"
git push origin develop

# Check GitHub Actions tab for workflow run

# Test production deployment
git checkout main
git merge develop
git push origin main

# Approve deployment in GitHub (if protection enabled)
```

### Step 5: Ongoing Development Workflow

#### 5.1. Development Process

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 3. Create Pull Request to develop
# - GitHub will run CI tests
# - Merge when tests pass

# 4. Automatic staging deployment
# - Push to develop triggers staging deployment

# 5. Production deployment
git checkout main
git merge develop
git push origin main
# - Triggers production deployment (with approval)
```

#### 5.2. Manual Deployments

```bash
# Deploy specific branch to production
gh workflow run manual-deploy.yml \
  -f environment=production \
  -f branch=hotfix-urgent-fix

# Deploy to staging from any branch
gh workflow run manual-deploy.yml \
  -f environment=staging \
  -f branch=feature/test-this
```

#### 5.3. Database Operations

```bash
# Run migrations
gh workflow run db-migration.yml \
  -f environment=production \
  -f migration_type=deploy

# Seed database
gh workflow run db-migration.yml \
  -f environment=production \
  -f migration_type=seed

# Reset database (DANGER!)
gh workflow run db-migration.yml \
  -f environment=staging \
  -f migration_type=reset \
  -f confirm_reset=CONFIRM
```

---

## 🔍 Verification & Testing

### Check Application Health

```bash
# Health endpoint
curl https://yourdomain.com/health

# API documentation
curl https://yourdomain.com/api

# Test specific endpoints
curl https://yourdomain.com/api/posts
```

### Monitor Logs

```bash
# SSH into server
ssh root@YOUR_VPS_IP

# Application logs
docker logs nestjs-app -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -f
```

### Performance Testing

```bash
# Simple load test
ab -n 1000 -c 10 https://yourdomain.com/health

# Or use curl for response time
curl -w "Response time: %{time_total}s\n" -s -o /dev/null https://yourdomain.com/health
```

---

## 🛠️ Troubleshooting Guide

### Common Issues

#### 1. SSH Connection Failed

```bash
# Problem: Can't connect to VPS
# Solutions:
ssh -v root@YOUR_VPS_IP  # Verbose mode for debugging
ssh-keygen -R YOUR_VPS_IP  # Remove old host key
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_VPS_IP  # Re-copy key
```

#### 2. Domain Not Resolving

```bash
# Problem: Domain doesn't point to server
# Solutions:
nslookup yourdomain.com  # Check DNS resolution
dig yourdomain.com  # Detailed DNS info
# Wait for DNS propagation (up to 24 hours)
```

#### 3. SSL Certificate Failed

```bash
# Problem: Let's Encrypt certificate failed
# Solutions:
ssh root@YOUR_VPS_IP
certbot certificates  # Check certificate status
certbot renew --dry-run  # Test renewal
certbot delete --cert-name yourdomain.com  # Delete and recreate
```

#### 4. Application Won't Start

```bash
# Problem: Docker containers not running
# Solutions:
ssh root@YOUR_VPS_IP
cd /opt/nestjs-blog-api
docker-compose -f docker-compose.prod.yml ps  # Check container status
docker-compose -f docker-compose.prod.yml logs app  # Check app logs
docker-compose -f docker-compose.prod.yml restart  # Restart services
```

#### 5. Database Connection Failed

```bash
# Problem: Can't connect to database
# Solutions:
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
docker-compose -f docker-compose.prod.yml logs postgres
# Check DATABASE_URL in .env file
```

#### 6. GitHub Actions Failed

```bash
# Problem: Workflow fails
# Solutions:
# 1. Check workflow logs in GitHub Actions tab
# 2. Verify secrets are set correctly
# 3. Test SSH connection manually:
ssh -i ~/.ssh/github_actions_key root@YOUR_VPS_IP
```

### Getting Help

1. **Check Logs**: Always start with application and system logs
2. **Verify Configuration**: Ensure all secrets and DNS are correct
3. **Test Manually**: Try manual steps to isolate issues
4. **Resource Check**: Ensure VPS has enough CPU/memory/disk
5. **Network Check**: Verify firewall and port accessibility

---

## 📊 Monitoring & Maintenance

### Daily Operations

```bash
# Check application health (automated via GitHub Actions)
curl https://yourdomain.com/health

# Monitor resource usage
ssh root@YOUR_VPS_IP
htop  # CPU and memory
df -h  # Disk usage
docker stats  # Container resource usage
```

### Weekly Maintenance

```bash
# Update system packages
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y

# Clean Docker images
docker system prune -f

# Check backup status
ls -la /opt/backups/
```

### Monthly Tasks

```bash
# Rotate backups (automated via monitoring scripts)
# Review security logs
# Update SSL certificates (automated)
# Review application performance
```

---

## 🎯 Production Checklist

Before going live:

### Infrastructure

- [ ] VPS properly sized for expected traffic
- [ ] Domain DNS properly configured
- [ ] SSL certificate working
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Backups configured and tested

### Application

- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] Application health check passing
- [ ] All API endpoints working
- [ ] Error handling tested

### Security

- [ ] SSH key-based authentication only
- [ ] Non-root user created (deploy user)
- [ ] Fail2ban configured
- [ ] Security headers configured in Nginx
- [ ] Secrets properly managed

### Monitoring

- [ ] Health checks configured
- [ ] Log rotation working
- [ ] Backup scripts tested
- [ ] Performance monitoring setup
- [ ] Alert mechanisms working

### CI/CD (if using GitHub Actions)

- [ ] All secrets configured
- [ ] Environment protection enabled
- [ ] Workflows tested
- [ ] Branch protection rules set
- [ ] Review process established

---

## 🎉 Success!

Once completed, you'll have:

✅ **Production-ready API** running on your VPS  
✅ **Automated SSL certificates** with Let's Encrypt  
✅ **Security hardening** with firewall and fail2ban  
✅ **Monitoring and backups** automated  
✅ **CI/CD pipeline** for easy updates  
✅ **Zero-downtime deployments**

Your NestJS Blog API is now ready to serve traffic at `https://yourdomain.com`!

### Next Steps

1. **Add content** via API endpoints
2. **Monitor performance** and scale as needed
3. **Set up additional monitoring** (Grafana, etc.)
4. **Configure CDN** for static assets
5. **Add more environments** (QA, development)

---

## 📚 Additional Resources

- **[Infrastructure Documentation](infrastructure/README.md)** - Detailed Ansible configuration
- **[GitHub Actions Setup](.github/README.md)** - CI/CD configuration guide
- **[Quick Start Guide](DEPLOYMENT.md)** - Simplified deployment instructions
- **[API Documentation](README.md)** - Application features and API endpoints

For support, create an issue in the repository or check the troubleshooting section above.
