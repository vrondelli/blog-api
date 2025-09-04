# 🚀 Quick Start Guide - Infrastructure as Code

Get your NestJS Blog API running in production in minutes!

## Option 1: Deploy to VPS (Production)

### Prerequisites

- VPS with Ubuntu 20.04+ (DigitalOcean, Linode, Vultr, etc.)
- Domain name pointed to your VPS IP
- SSH access to your VPS

### 1. Setup Tools

```bash
# Install Ansible, Docker, and generate SSH keys
./scripts/setup.sh
```

### 2. Copy SSH Key to VPS

```bash
# Replace YOUR_VPS_IP with your actual VPS IP
ssh-copy-id root@YOUR_VPS_IP
```

### 3. Deploy Application

```bash
# Replace with your actual domain and VPS IP
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP
```

### 4. Access Your Application

- **API**: https://yourdomain.com/api
- **Health Check**: https://yourdomain.com/health

## Option 2: Local Production Environment

Test the production setup locally with Docker:

```bash
# Start production-like environment
npm run deploy:dev

# View logs
npm run deploy:dev:logs

# Stop environment
npm run deploy:dev:down
```

Access locally:

- **Application**: http://localhost (via Nginx)
- **API Direct**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Example: Complete DigitalOcean Deployment

```bash
# 1. Create DigitalOcean droplet
# - Ubuntu 20.04
# - $5/month basic droplet
# - Add your SSH key

# 2. Point your domain to the droplet IP
# - Add A record: @ -> DROPLET_IP
# - Add A record: www -> DROPLET_IP

# 3. Deploy
./scripts/deploy.sh production example.com 134.122.123.45

# 4. Update your application later
./scripts/update.sh production example.com 134.122.123.45
```

## What Gets Deployed

### 🔧 Infrastructure

- **Server**: Ubuntu 20.04+ with security hardening
- **Reverse Proxy**: Nginx with SSL termination
- **SSL**: Automatic Let's Encrypt certificates
- **Database**: PostgreSQL 15 with persistence
- **Cache**: Redis with persistence
- **Firewall**: UFW with fail2ban protection

### 📊 Monitoring

- **Health Checks**: Automatic application monitoring
- **Backups**: Daily database and file backups
- **Logs**: Centralized logging with rotation
- **Alerts**: System resource monitoring

### 🔒 Security

- **SSL/TLS**: Strong cipher suites and HSTS
- **Firewall**: Only essential ports open (22, 80, 443)
- **SSH**: Key-based authentication only
- **Rate Limiting**: DDoS protection
- **Headers**: Security headers configured

## Troubleshooting

### Connection Issues

```bash
# Test SSH connection
ssh root@YOUR_VPS_IP

# Check if port 22 is open
telnet YOUR_VPS_IP 22
```

### Application Issues

```bash
# Check application status
ssh root@YOUR_VPS_IP 'docker ps'

# View application logs
ssh root@YOUR_VPS_IP 'docker logs nestjs-app'

# Restart application
ssh root@YOUR_VPS_IP 'cd /opt/nestjs-blog-api && docker-compose -f docker-compose.prod.yml restart'
```

### SSL Issues

```bash
# Check SSL certificate
ssh root@YOUR_VPS_IP 'certbot certificates'

# Renew certificate manually
ssh root@YOUR_VPS_IP 'certbot renew --force-renewal'
```

## Cost Breakdown

### VPS Providers (Monthly)

- **DigitalOcean**: $5-10 (Basic droplet)
- **Linode**: $5-10 (Nanode/Shared CPU)
- **Vultr**: $5-10 (Regular Performance)
- **Hetzner**: $3-5 (CX11/CX21)

### Domain

- **Domain Registration**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)

### Total Monthly Cost: $5-10

## Production Checklist

Before going live:

- [ ] Domain DNS configured
- [ ] VPS SSH access working
- [ ] SSL certificates generated
- [ ] Health check responding
- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Backups configured
- [ ] Monitoring setup

## Next Steps

1. **Custom Domain**: Configure your domain's DNS
2. **Environment Variables**: Update production settings
3. **Database Seeding**: Add initial data
4. **Monitoring**: Set up additional monitoring
5. **CI/CD**: Integrate with GitHub Actions

## Support

- **Documentation**: [infrastructure/README.md](infrastructure/README.md)
- **Issues**: Create a GitHub issue
- **Community**: Join our Discord server

---

🎉 **Congratulations!** Your NestJS Blog API is now running in production with enterprise-grade infrastructure!
