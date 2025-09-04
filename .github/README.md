# GitHub Actions CI/CD Setup

This guide explains how to set up automated deployment using GitHub Actions for your NestJS Blog API.

## 🚀 Features

- **Automated Testing**: Unit tests, E2E tests, and code quality checks
- **Multi-Environment Deployment**: Staging and production environments
- **Manual Deployment**: Deploy specific branches/tags on demand
- **Database Migrations**: Safe database migration workflows
- **Health Monitoring**: Automated health checks and performance monitoring
- **Docker Integration**: Build and push Docker images
- **Security**: SSH key-based authentication and secure secrets management

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **VPS Servers**: At least one VPS for production (optionally staging)
3. **Domain Names**: Configured domains pointing to your VPS IPs
4. **Docker Hub Account**: For storing Docker images (optional)

## 🔧 Setup Instructions

### 1. Configure Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

#### Required Secrets:

```bash
# SSH Configuration
SSH_PRIVATE_KEY          # Your private SSH key content

# Production Environment
PRODUCTION_HOST          # Production VPS IP address
PRODUCTION_USER          # SSH user (usually 'root' or 'deploy')
PRODUCTION_DOMAIN        # Your production domain (e.g., api.yourdomain.com)

# Staging Environment (Optional)
STAGING_HOST            # Staging VPS IP address
STAGING_USER            # SSH user for staging
STAGING_DOMAIN          # Your staging domain (e.g., staging-api.yourdomain.com)

# SSL Configuration
SSL_EMAIL               # Email for Let's Encrypt certificates

# Docker Hub (Optional)
DOCKER_USERNAME         # Docker Hub username
DOCKER_PASSWORD         # Docker Hub password or access token
```

#### Required Variables:

Go to Settings → Secrets and variables → Actions → Variables tab:

```bash
# Domain names (for health checks)
PRODUCTION_DOMAIN       # Same as secret but as variable
STAGING_DOMAIN          # Same as secret but as variable
```

### 2. Generate SSH Key Pair

If you don't have SSH keys set up:

```bash
# Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions_key -N ""

# Copy public key to your servers
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_VPS_IP

# Copy private key content to GitHub secrets
cat ~/.ssh/github_actions_key
```

### 3. Configure Environment Protection

1. Go to Settings → Environments
2. Create environments: `staging` and `production`
3. For production, add protection rules:
   - ✅ Required reviewers
   - ✅ Wait timer (optional)
   - ✅ Deployment branches (only `main`)

### 4. Initial Server Setup

Before using GitHub Actions, ensure your servers are initially set up:

```bash
# Clone your repository and run initial deployment
git clone your-repo-url
cd your-repo

# Initial deployment (manual)
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP
```

## 📖 Workflow Guide

### Automated Workflows

| Workflow           | Trigger                  | Description                            |
| ------------------ | ------------------------ | -------------------------------------- |
| **CI/CD Pipeline** | Push to `main`/`develop` | Full test suite + automatic deployment |
| **Health Check**   | Every 15 minutes         | Monitors application health            |

### Manual Workflows

| Workflow               | Usage     | Description                               |
| ---------------------- | --------- | ----------------------------------------- |
| **Manual Deploy**      | On-demand | Deploy specific branch to any environment |
| **Database Migration** | On-demand | Run database migrations safely            |
| **Performance Check**  | On-demand | Test application performance              |

### Branch Strategy

```bash
main        # → Production deployment
develop     # → Staging deployment
feature/*   # → CI tests only
hotfix/*    # → CI tests only
```

## 🚀 Deployment Process

### Automatic Deployment

1. **Push to `develop`** → Deploys to staging
2. **Push to `main`** → Deploys to production

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Manual Deploy" workflow
3. Click "Run workflow"
4. Choose:
   - Environment (staging/production)
   - Branch/tag to deploy
   - Force deploy option (skip health checks)

### Database Migrations

1. Go to Actions tab
2. Select "Database Migration" workflow
3. Choose migration type:
   - **deploy**: Apply pending migrations
   - **reset**: Reset database (DANGER!)
   - **seed**: Seed database with initial data

## 🔍 Monitoring

### Health Checks

- **Automatic**: Every 15 minutes
- **Manual**: Run via workflow dispatch
- **Endpoints**: `/health` and `/api`
- **Alerts**: Creates GitHub issues on failure

### Performance Monitoring

- **Response time monitoring**
- **Load testing capabilities**
- **Manual trigger for detailed analysis**

## 🛠️ Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

```bash
# Check if SSH key is correct
ssh -i ~/.ssh/github_actions_key root@YOUR_VPS_IP

# Verify SSH key in GitHub secrets
# Ensure the private key includes BEGIN/END lines
```

#### 2. Deployment Failed

```bash
# Check workflow logs in GitHub Actions
# Verify server resources (disk space, memory)
# Check application logs on server

ssh root@YOUR_VPS_IP 'docker logs nestjs-app'
```

#### 3. Health Check Failed

```bash
# Manually check application health
curl https://yourdomain.com/health

# Check server status
ssh root@YOUR_VPS_IP 'docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml ps'
```

### Rollback Process

If deployment fails:

```bash
# Option 1: Re-run previous successful deployment
# Go to Actions → Find last successful workflow → Re-run

# Option 2: Manual rollback on server
ssh root@YOUR_VPS_IP
cd /opt/nestjs-blog-api
git checkout PREVIOUS_COMMIT_HASH
docker-compose -f docker-compose.prod.yml restart
```

## 📊 Workflow Files

| File                                  | Purpose             |
| ------------------------------------- | ------------------- |
| `.github/workflows/ci-cd.yml`         | Main CI/CD pipeline |
| `.github/workflows/manual-deploy.yml` | Manual deployment   |
| `.github/workflows/db-migration.yml`  | Database migrations |
| `.github/workflows/health-check.yml`  | Health monitoring   |

## 🔒 Security Best Practices

1. **SSH Keys**: Use dedicated SSH keys for GitHub Actions
2. **Secrets**: Never commit secrets to code
3. **Environment Protection**: Require reviews for production
4. **Branch Protection**: Protect main branch from direct pushes
5. **Regular Updates**: Keep dependencies and base images updated

## 📈 Monitoring Dashboard

Track your deployments:

1. **GitHub Actions**: View workflow runs and success rates
2. **Issues**: Automated health check failures
3. **Insights**: Repository deployment frequency and success rate

## 🎯 Advanced Configuration

### Custom Environment Variables

Add to your workflow files:

```yaml
env:
  CUSTOM_VAR: ${{ secrets.CUSTOM_VALUE }}
```

### Slack Notifications

Add Slack integration:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Blue-Green Deployment

For zero-downtime deployments, modify the update playbook to:

1. Deploy to secondary container
2. Switch traffic
3. Remove old container

## 📝 Example Secrets Configuration

Create a `.env.secrets` file locally (DO NOT COMMIT):

```bash
# Copy these values to GitHub Secrets
SSH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"

PRODUCTION_HOST="123.456.789.10"
PRODUCTION_USER="root"
PRODUCTION_DOMAIN="api.yourdomain.com"

STAGING_HOST="123.456.789.11"
STAGING_USER="root"
STAGING_DOMAIN="staging-api.yourdomain.com"

SSL_EMAIL="admin@yourdomain.com"
DOCKER_USERNAME="your-docker-username"
DOCKER_PASSWORD="your-docker-token"
```

## 🎉 Ready to Deploy!

After completing this setup:

1. Push code to `develop` branch → Staging deployment
2. Create pull request to `main` → Production deployment
3. Monitor via GitHub Actions and health checks
4. Use manual workflows for special operations

Your NestJS Blog API now has enterprise-grade CI/CD automation! 🚀
