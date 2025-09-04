# Infrastructure as Code (IaC) Documentation

This directory contains Infrastructure as Code (IaC) configuration for deploying the NestJS Blog API to any VPS with Docker, Nginx, PostgreSQL, and Redis.

## Features

- ✅ **Automated VPS Setup**: Complete server configuration with security hardening
- ✅ **Docker Deployment**: Production-ready containerized application
- ✅ **Nginx Reverse Proxy**: Load balancing, SSL termination, and security headers
- ✅ **SSL/TLS**: Automatic Let's Encrypt certificate generation and renewal
- ✅ **Database Management**: PostgreSQL with automated backups
- ✅ **Redis Caching**: High-performance caching layer
- ✅ **Security Hardening**: Firewall, fail2ban, SSH security
- ✅ **Monitoring**: Health checks, log rotation, automated backups
- ✅ **Zero-Downtime Updates**: Rolling updates with automatic rollback

## Prerequisites

1. **Ansible** (for VPS deployment)

   ```bash
   pip install ansible
   ```

2. **Docker & Docker Compose** (for local development)

   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **VPS Requirements**:
   - Ubuntu 20.04+ or Debian 11+
   - Minimum 1GB RAM, 1 CPU, 20GB storage
   - Root SSH access
   - Public IP address

## Quick Start

### 1. Deploy to VPS

```bash
# Basic deployment
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP

# With custom git repository
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP https://github.com/yourusername/your-repo.git
```

### 2. Update Application

```bash
# Update from main branch
./scripts/update.sh production yourdomain.com YOUR_VPS_IP

# Update from specific branch
./scripts/update.sh production yourdomain.com YOUR_VPS_IP develop
```

### 3. Local Production-like Development

```bash
# Start production-like environment locally
./scripts/dev-prod.sh up

# View logs
./scripts/dev-prod.sh logs

# Stop environment
./scripts/dev-prod.sh down
```

## Directory Structure

```
infrastructure/
├── ansible/                    # Ansible configuration
│   ├── ansible.cfg            # Ansible settings
│   ├── inventory/             # Server inventory
│   │   └── hosts.yml         # Host definitions
│   ├── playbooks/            # Deployment playbooks
│   │   ├── deploy.yml        # Initial deployment
│   │   └── update.yml        # Application updates
│   └── roles/                # Ansible roles
│       ├── common/           # Common system setup
│       ├── security/         # Security hardening
│       ├── docker/           # Docker installation
│       ├── application/      # Application deployment
│       ├── ssl/              # SSL certificate management
│       └── monitoring/       # Monitoring and backups
├── docker/                   # Docker configuration
│   └── nginx/               # Nginx configuration
│       ├── nginx.conf       # Main Nginx config
│       └── conf.d/          # Virtual host configs
└── scripts/                 # Deployment scripts
    ├── deploy.sh           # Deploy to VPS
    ├── update.sh           # Update application
    └── dev-prod.sh         # Local development
```

## Configuration

### Environment Variables

The deployment automatically generates a production `.env` file with:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/blog_db
REDIS_URL=redis://:password@localhost:6379
JWT_SECRET=auto-generated-secret
# ... other variables
```

### Ansible Inventory

Update `infrastructure/ansible/inventory/hosts.yml`:

```yaml
all:
  children:
    production:
      hosts:
        prod-server:
          ansible_host: YOUR_VPS_IP
          domain_name: yourdomain.com
          ssl_email: your-email@example.com
```

## Security Features

### Firewall Configuration

- Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) are open
- UFW firewall enabled with default deny policy

### SSH Hardening

- Root login disabled (after initial setup)
- Password authentication disabled
- Key-based authentication only

### Fail2Ban Protection

- SSH brute force protection
- Nginx rate limiting protection
- Automatic IP banning for suspicious activity

### SSL/TLS Security

- Let's Encrypt certificates with automatic renewal
- TLS 1.2+ only
- Strong cipher suites
- HSTS headers

## Monitoring & Maintenance

### Health Checks

- Application health endpoint monitoring every 5 minutes
- Automatic restart on failure
- Disk and memory usage monitoring

### Automated Backups

- Daily database backups at 3 AM
- Application file backups
- 7-day retention policy
- Backups stored in `/opt/backups`

### Log Management

- Application logs rotated daily
- Nginx logs rotated daily
- Docker container log limits
- Centralized logging in `/var/log`

## Deployment Process

### Initial Deployment

1. **Server Preparation**
   - Update system packages
   - Install Docker and dependencies
   - Configure firewall and security
   - Create application user

2. **Application Setup**
   - Clone repository
   - Build Docker images
   - Start services (App, Nginx, PostgreSQL, Redis)
   - Run database migrations

3. **SSL Configuration**
   - Generate Let's Encrypt certificates
   - Configure Nginx with SSL
   - Set up automatic renewal

4. **Monitoring Setup**
   - Install health check scripts
   - Configure log rotation
   - Set up automated backups

### Update Process

1. **Backup Creation**
   - Database backup
   - Application file backup
   - Configuration backup

2. **Application Update**
   - Pull latest code
   - Rebuild Docker images
   - Rolling restart with zero downtime
   - Run database migrations

3. **Verification**
   - Health check validation
   - Service availability test
   - Rollback on failure

## Troubleshooting

### Common Issues

1. **Connection Failed**

   ```bash
   # Check SSH connectivity
   ssh root@YOUR_VPS_IP

   # Verify SSH key
   ssh-add -l
   ```

2. **SSL Certificate Issues**

   ```bash
   # Check certificate status
   ssh root@YOUR_VPS_IP 'certbot certificates'

   # Manual renewal
   ssh root@YOUR_VPS_IP 'certbot renew --force-renewal'
   ```

3. **Application Not Starting**

   ```bash
   # Check application logs
   ssh root@YOUR_VPS_IP 'docker logs nestjs-app'

   # Check all services
   ssh root@YOUR_VPS_IP 'docker-compose -f /opt/nestjs-blog-api/docker-compose.prod.yml ps'
   ```

### Log Locations

- Application logs: `/opt/nestjs-blog-api/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`
- Docker logs: `docker logs <container-name>`

### Useful Commands

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Check service status
systemctl status nestjs-blog-api

# View application logs
docker logs nestjs-app -f

# Database console
docker exec -it postgres-db psql -U blog_user -d blog_db

# Redis console
docker exec -it redis-cache redis-cli

# Restart application
cd /opt/nestjs-blog-api && docker-compose -f docker-compose.prod.yml restart app

# Manual backup
/opt/monitoring/backup.sh
```

## Production Checklist

Before going live:

- [ ] Domain DNS pointed to VPS IP
- [ ] SSL certificates generated and valid
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] Backups configured and tested
- [ ] Monitoring alerts set up
- [ ] Security scan completed

## Performance Optimization

### Nginx Configuration

- Gzip compression enabled
- Static file caching
- Connection keep-alive
- Rate limiting configured

### Database Optimization

- Connection pooling
- Query optimization
- Regular VACUUM and ANALYZE
- Backup compression

### Redis Configuration

- Memory optimization
- Persistence configuration
- Connection pooling
- Cache eviction policies

## Cost Estimation

### VPS Requirements by Scale

| Scale  | RAM | CPU     | Storage | Monthly Cost\* |
| ------ | --- | ------- | ------- | -------------- |
| Small  | 1GB | 1 Core  | 25GB    | $5-10          |
| Medium | 2GB | 2 Cores | 50GB    | $10-20         |
| Large  | 4GB | 4 Cores | 100GB   | $20-40         |

\*Costs vary by provider (DigitalOcean, Linode, Vultr, etc.)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review application logs
3. Check system logs
4. Create an issue in the repository

## License

This infrastructure configuration is part of the NestJS Blog API project and follows the same license terms.
