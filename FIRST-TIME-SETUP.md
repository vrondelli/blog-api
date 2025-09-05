# 🚀 First-Time VPS Setup Guide

## From Zero to GitHub Actions Deployment

This guide takes you from a fresh VPS to a fully automated GitHub Actions deployment pipeline. Follow these steps in order for a successful setup.

---

## 📋 Prerequisites

Before starting, make sure you have:

- [ ] **VPS Server** (DigitalOcean, Linode, Vultr, etc.)
  - Ubuntu 20.04+ or Debian 11+
  - Minimum: 1GB RAM, 1 CPU, 20GB storage
  - Root SSH access
- [ ] **Domain Name** (recommended)
  - DNS pointing to your VPS IP
- [ ] **GitHub Account** with this repository
- [ ] **Local Machine** with Git and SSH

---

## 🎯 Phase 1: Initial VPS Setup

### Step 1.1: Create and Access VPS

1. **Create VPS** at your preferred provider:

   ```bash
   # Example specs:
   # - Ubuntu 20.04 LTS
   # - 1GB RAM, 1 CPU
   # - Add your SSH key during creation
   ```

2. **Test SSH Access**:

   ```bash
   ssh root@YOUR_VPS_IP
   ```

3. **Update System**:
   ```bash
   apt update && apt upgrade -y
   ```

### Step 1.2: Basic Security Setup

```bash
# Install essential packages
apt install -y ufw fail2ban

# Configure firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw --force enable

# Start fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Create non-root user
useradd -m -s /bin/bash -G sudo deploy
```

### Step 1.3: Setup SSH Keys for GitHub

This is crucial - your VPS needs to clone code from GitHub:

```bash
# Generate SSH key for GitHub access
ssh-keygen -t rsa -b 4096 -C "deploy@yourdomain.com" -f /root/.ssh/github_deploy_key

# Display the public key
cat /root/.ssh/github_deploy_key.pub
```

**Copy this public key** and add it to GitHub:

1. Go to GitHub.com → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Title: `VPS Deploy Key - YOUR_VPS_IP`
4. Paste the public key
5. Click "Add SSH key"

**Test the connection**:

```bash
# Test GitHub SSH access
ssh -T git@github.com -i /root/.ssh/github_deploy_key

# Configure Git to use this key
git config --global core.sshCommand "ssh -i /root/.ssh/github_deploy_key"
git config --global user.name "Deploy User"
git config --global user.email "deploy@yourdomain.com"
```

---

## 🛠️ Phase 2: Local Machine Setup

### Step 2.1: Clone Repository

```bash
# Clone your repository locally
git clone https://github.com/yourusername/blog-api.git
cd blog-api
```

### Step 2.2: Install Ansible

Choose the method that works best for your system:

**Option 1: System Package Manager (Recommended)**

```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install -y ansible

# For macOS
brew install ansible

# Verify installation
ansible --version
```

**Option 2: If you get "externally-managed-environment" error**

```bash
# Use virtual environment
python3 -m venv ansible-env
source ansible-env/bin/activate
pip install ansible

# Or use pipx
sudo apt install -y pipx
pipx install ansible
pipx ensurepath
source ~/.bashrc
```

### Step 2.3: Generate SSH Key for Ansible

```bash
# Generate SSH key for Ansible to access VPS
ssh-keygen -t rsa -b 4096 -f ~/.ssh/blog_api_deploy -N ""

# Copy to VPS
ssh-copy-id -i ~/.ssh/blog_api_deploy.pub root@YOUR_VPS_IP

# Test connection
ssh -i ~/.ssh/blog_api_deploy root@YOUR_VPS_IP
```

---

## 🚀 Phase 3: Environment Configuration & First Deployment

### Step 3.1: Configure Environment Variables

The deployment system now uses environment variables for all configuration, making it much easier to manage multiple environments.

**Create your environment configuration:**

```bash
# Copy the environment template
cp infrastructure/ansible/.env.template infrastructure/ansible/.env

# Edit the file with your actual values
vim infrastructure/ansible/.env  # or use your preferred editor
```

**Update the following required values in `.env`:**

```bash
# VPS Configuration (Required)
VPS_HOST=YOUR_VPS_IP_ADDRESS
VPS_USER=root
SSH_PRIVATE_KEY_FILE=~/.ssh/blog_api_deploy

# Domain Configuration (Required)
DOMAIN_NAME=yourdomain.com
SSL_EMAIL=your-email@yourdomain.com

# Git Repository Configuration (Required)
GIT_REPO_URL=git@github.com:yourusername/blog-api.git
GIT_BRANCH=main

# Environment
ENVIRONMENT=production
```

**All other variables have sensible defaults and are optional.**

### Step 3.2: Validate Configuration

```bash
# Load and validate your environment configuration
./scripts/load-env.sh

# This will:
# ✅ Load environment variables from .env file
# ✅ Validate required variables are set
# ✅ Show current configuration
# ✅ Check for any issues
```

### Step 3.3: Run First Deployment

Now you can deploy using the environment file:

```bash
# Deploy using environment file (recommended)
./scripts/deploy.sh --env-file infrastructure/ansible/.env

# OR use command line arguments (still works)
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP

# This will:
# ✅ Install Docker on VPS
# ✅ Clone your repository
# ✅ Build application containers
# ✅ Setup SSL certificates
# ✅ Configure Nginx
# ✅ Start all services
```

### Step 3.3: Verify Deployment

```bash
# Check if application is running
curl https://yourdomain.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

**If successful, your application is now running!** 🎉

---

## 🔄 Phase 4: GitHub Actions Setup

Now let's setup automated deployments with GitHub Actions.

### Step 4.1: Generate SSH Key for GitHub Actions

```bash
# Generate dedicated SSH key for GitHub Actions
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions_key -N ""

# Copy to VPS
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_VPS_IP

# Test connection
ssh -i ~/.ssh/github_actions_key root@YOUR_VPS_IP
```

### Step 4.2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

**Add these Repository Secrets:**

| Secret Name         | Value                                                |
| ------------------- | ---------------------------------------------------- |
| `SSH_PRIVATE_KEY`   | Content of `~/.ssh/github_actions_key` (entire file) |
| `PRODUCTION_HOST`   | Your VPS IP address                                  |
| `PRODUCTION_USER`   | `root`                                               |
| `PRODUCTION_DOMAIN` | `yourdomain.com`                                     |
| `SSL_EMAIL`         | `your-email@domain.com`                              |

**Add these Repository Variables:**
| Variable Name | Value |
|---------------|-------|
| `PRODUCTION_DOMAIN` | `yourdomain.com` |

### Step 4.3: Test GitHub Actions

1. **Make a small change**:

   ```bash
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "Test GitHub Actions deployment"
   git push origin main
   ```

2. **Watch GitHub Actions**:
   - Go to your repository → Actions tab
   - You should see a workflow running
   - It should deploy to your VPS automatically

3. **Verify deployment**:
   ```bash
   curl https://yourdomain.com/health
   ```

---

## ✅ Success Checklist

After completing all phases, you should have:

### Production Environment

- [ ] VPS running your application
- [ ] Domain pointing to your VPS
- [ ] SSL certificate working (`https://yourdomain.com`)
- [ ] Application health check passing
- [ ] GitHub Actions deploying on push to `main`

### Development Workflow

- [ ] Push to `main` → Automatic production deployment
- [ ] Manual deployment available via GitHub Actions
- [ ] All deployments visible in GitHub Actions

### Verification Commands

```bash
# Check production
curl https://yourdomain.com/health
curl https://yourdomain.com/api

# Test API endpoints
# Create a blog post
curl -X POST https://yourdomain.com/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "content": "This is the content of my first blog post running with modern infrastructure."
  }'

# Create a comment (replace POST_ID with actual post ID)
curl -X POST https://yourdomain.com/api/posts/POST_ID/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great post! Thanks for sharing.",
    "author": "Blog Reader"
  }'

# Get all posts
curl https://yourdomain.com/api/posts

# Get a specific post with comments
curl "https://yourdomain.com/api/posts/POST_ID?includeComments=true"

# Check GitHub Actions
# Go to: https://github.com/yourusername/blog-api/actions
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

```bash
# Check SSH key permissions
chmod 600 ~/.ssh/github_actions_key
chmod 600 ~/.ssh/blog_api_deploy

# Test with verbose output
ssh -v -i ~/.ssh/blog_api_deploy root@YOUR_VPS_IP
```

#### 2. GitHub SSH Access Failed

```bash
# SSH into VPS and test
ssh root@YOUR_VPS_IP
ssh -T git@github.com -i /root/.ssh/github_deploy_key

# Check if key was added to GitHub correctly
```

#### 3. Domain Not Resolving

```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com

# May take up to 24 hours for DNS propagation
```

#### 4. SSL Certificate Failed

```bash
# SSH into VPS and check
ssh root@YOUR_VPS_IP
cd /opt/nestjs-blog-api
docker-compose -f docker-compose.prod.yml logs nginx

# Manual certificate request
certbot --nginx -d yourdomain.com
```

#### 5. GitHub Actions Failed

- Check workflow logs in GitHub Actions tab
- Verify all secrets are set correctly
- Ensure SSH keys have proper permissions

### Getting Help

1. **Check logs**: Always start with application logs

   ```bash
   ssh root@YOUR_VPS_IP
   cd /opt/nestjs-blog-api
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **Test manually**: Try deployment script manually

   ```bash
   ./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP
   ```

3. **Verify configuration**: Check all secrets and DNS settings

---

## 🎉 Congratulations!

You now have a streamlined production CI/CD pipeline:

✅ **Production-ready application** running on VPS with PM2 process manager  
✅ **Automated SSL certificates** with Let's Encrypt  
✅ **Security hardening** with firewall and fail2ban  
✅ **GitHub Actions CI/CD** for automatic deployments  
✅ **Zero-downtime deployments** with PM2 clustering

### Next Steps

1. **Add monitoring** - Setup health checks and alerts
2. **Database backups** - Configure automated backups
3. **Performance tuning** - Optimize for your traffic
4. **Custom domain** - Configure your production domain

Your NestJS Blog API is now production-ready with streamlined CI/CD! 🚀

---

## 📚 Quick Reference

### Key Commands

```bash
# Deploy manually
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP

# Update application
./scripts/update.sh production yourdomain.com YOUR_VPS_IP

# Check deployment
curl https://yourdomain.com/health

# Check logs
ssh root@YOUR_VPS_IP
docker logs nestjs-app

# Monitor PM2 processes
ssh root@YOUR_VPS_IP
docker exec -it nestjs-app pm2 list
docker exec -it nestjs-app pm2 logs
docker exec -it nestjs-app pm2 monit
```

### Important Files

- `infrastructure/ansible/inventory/hosts.yml` - VPS configuration
- `.github/workflows/ci-cd.yml` - GitHub Actions workflow
- `docker-compose.prod.yml` - Production containers
- `scripts/deploy.sh` - Deployment script

### GitHub Actions Triggers

- Push to `main` → Production deployment
- Manual deployment via Actions tab
