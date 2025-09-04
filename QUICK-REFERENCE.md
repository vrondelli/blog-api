# 🚀 Quick Reference - Deployment Commands

## Prerequisites Setup

```bash
# Install all prerequisites (Ansible, Docker, SSH keys)
./scripts/setup.sh

# Setup GitHub Actions secrets and SSH keys
npm run ci:setup
```

## Manual Deployment

```bash
# Initial deployment to production
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP

# Update existing deployment
./scripts/update.sh production yourdomain.com YOUR_VPS_IP

# Local production-like testing
npm run deploy:dev        # Start
npm run deploy:dev:logs   # View logs
npm run deploy:dev:down   # Stop
```

## GitHub Actions (Automated)

```bash
# Staging deployment (automatic)
git push origin develop

# Production deployment (automatic)
git push origin main

# Manual deployment (any branch)
gh workflow run manual-deploy.yml -f environment=production -f branch=hotfix-123

# Database operations
gh workflow run db-migration.yml -f environment=production -f migration_type=deploy
gh workflow run db-migration.yml -f environment=production -f migration_type=seed

# Health check
gh workflow run health-check.yml -f environment=both
```

## Server Management

```bash
# SSH into server
ssh root@YOUR_VPS_IP

# Check application status
docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml ps

# View logs
docker logs nestjs-app -f
docker logs nginx-proxy -f
docker logs postgres-db -f
docker logs redis-cache -f

# Restart application
docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml restart app

# Database access
docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml exec postgres psql -U blog_user -d blog_db

# Redis access
docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml exec redis redis-cli
```

## Health Checks

```bash
# Application health
curl https://yourdomain.com/health

# API endpoints
curl https://yourdomain.com/api
curl https://yourdomain.com/api/posts

# Performance test
curl -w "Response time: %{time_total}s\n" -s -o /dev/null https://yourdomain.com/health
```

## SSL Management

```bash
# Check SSL certificates
ssh root@YOUR_VPS_IP 'certbot certificates'

# Renew certificates manually
ssh root@YOUR_VPS_IP 'certbot renew --force-renewal'

# Test SSL configuration
curl -I https://yourdomain.com
```

## Backup & Recovery

```bash
# Manual backup
ssh root@YOUR_VPS_IP '/opt/monitoring/backup.sh'

# List backups
ssh root@YOUR_VPS_IP 'ls -la /opt/backups/'

# Restore from backup
ssh root@YOUR_VPS_IP
cd /opt/backups/BACKUP_DATE
# Restore database: psql -U blog_user -d blog_db < database.sql
```

## Troubleshooting

```bash
# Check system resources
ssh root@YOUR_VPS_IP 'htop'
ssh root@YOUR_VPS_IP 'df -h'
ssh root@YOUR_VPS_IP 'free -h'

# Check Docker containers
ssh root@YOUR_VPS_IP 'docker ps -a'
ssh root@YOUR_VPS_IP 'docker stats'

# Check system logs
ssh root@YOUR_VPS_IP 'journalctl -f'
ssh root@YOUR_VPS_IP 'tail -f /var/log/nginx/error.log'

# Restart all services
ssh root@YOUR_VPS_IP 'cd /opt/nestjs-blog-api && docker-compose -f docker-compose.prod.yml restart'

# Clean up Docker
ssh root@YOUR_VPS_IP 'docker system prune -f'
```

## Development Workflow

```bash
# Feature development
git checkout develop
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
# Create PR to develop

# Deploy to staging
git checkout develop
git merge feature/my-feature
git push origin develop
# Automatic staging deployment

# Deploy to production
git checkout main
git merge develop
git push origin main
# Automatic production deployment (with approval)
```

## Emergency Procedures

```bash
# Quick rollback (if recent deployment fails)
ssh root@YOUR_VPS_IP
cd /opt/nestjs-blog-api
git log --oneline -10  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH
docker-compose -f docker-compose.prod.yml restart

# Restore from backup
ssh root@YOUR_VPS_IP
cd /opt/backups/LATEST_BACKUP
docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml exec -T postgres psql -U blog_user -d blog_db < database.sql

# Force restart all services
ssh root@YOUR_VPS_IP
cd /opt/nestjs-blog-api
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Useful URLs

- **Application**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **Health Check**: https://yourdomain.com/health
- **GitHub Actions**: https://github.com/username/repo/actions
