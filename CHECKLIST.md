# ✅ Deployment Checklist

Use this checklist to ensure a successful deployment of your NestJS Blog API.

## Pre-Deployment Setup

### 🖥️ VPS Preparation

- [ ] VPS created with Ubuntu 20.04+ (minimum 1GB RAM, 1 CPU, 20GB storage)
- [ ] SSH access to VPS confirmed (`ssh root@YOUR_VPS_IP`)
- [ ] VPS IP address documented: `_________________`

### 🌐 Domain Setup (Optional but Recommended)

- [ ] Domain purchased and accessible
- [ ] DNS A record configured: `yourdomain.com` → `YOUR_VPS_IP`
- [ ] DNS propagation confirmed (`nslookup yourdomain.com`)
- [ ] Domain documented: `_________________`

### 💻 Local Environment

- [ ] Git installed and configured
- [ ] SSH keys generated (`ssh-keygen -t rsa -b 4096`)
- [ ] Repository cloned locally
- [ ] Prerequisites installed (`./scripts/setup.sh`)

---

## Deployment Method Selection

Choose your deployment method:

### Option A: Manual Deployment ✋

- [ ] SSH key copied to VPS (`ssh-copy-id root@YOUR_VPS_IP`)
- [ ] Connection tested (`ssh root@YOUR_VPS_IP`)
- [ ] Deployment script executed (`./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP`)

### Option B: GitHub Actions CI/CD 🤖

- [ ] Code pushed to GitHub repository
- [ ] GitHub Actions secrets configured (`npm run ci:setup`)
- [ ] SSH connection from GitHub Actions tested
- [ ] Environment protection rules configured (Settings → Environments)
- [ ] Initial manual deployment completed
- [ ] Automated deployment tested (push to develop/main)

---

## Post-Deployment Verification

### 🔍 Application Health

- [ ] Health endpoint responding: `curl https://yourdomain.com/health`
- [ ] API endpoint accessible: `curl https://yourdomain.com/api`
- [ ] Application logs clean: `ssh root@YOUR_VPS_IP 'docker logs nestjs-app'`
- [ ] All containers running: `docker-compose ps`

### 🔒 Security & SSL

- [ ] SSL certificate installed and valid
- [ ] HTTPS redirect working (HTTP → HTTPS)
- [ ] Security headers configured
- [ ] Firewall active with only necessary ports open (22, 80, 443)
- [ ] SSH password authentication disabled

### 🗄️ Database & Cache

- [ ] PostgreSQL container running and accessible
- [ ] Database migrations completed successfully
- [ ] Redis container running
- [ ] Cache functionality tested

### 📊 Monitoring & Backups

- [ ] Health check scripts configured
- [ ] Backup scripts operational (`/opt/monitoring/backup.sh`)
- [ ] Log rotation configured
- [ ] Monitoring cron jobs active

---

## Production Readiness

### 🚀 Performance

- [ ] Response time under 2 seconds (`curl -w "Time: %{time_total}s\n" https://yourdomain.com/health`)
- [ ] Load testing completed (optional)
- [ ] Resource monitoring setup

### 🔧 Operations

- [ ] Deployment process documented
- [ ] Access credentials securely stored
- [ ] Rollback procedure tested
- [ ] Update process verified (`./scripts/update.sh`)

### 📈 Monitoring

- [ ] GitHub Actions workflows configured (if using CI/CD)
- [ ] Health check alerts setup
- [ ] Log aggregation configured
- [ ] Backup verification scheduled

---

## Go-Live Checklist

### Final Verification

- [ ] All API endpoints tested and functional
- [ ] Error handling working correctly
- [ ] Rate limiting configured
- [ ] CORS settings appropriate for production
- [ ] Environment variables properly set

### Documentation

- [ ] Deployment process documented
- [ ] Access credentials documented securely
- [ ] Monitoring procedures documented
- [ ] Emergency contacts established

### Communication

- [ ] Stakeholders notified of go-live
- [ ] Support team briefed
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready

---

## Maintenance Schedule

### Daily

- [ ] Monitor application health (automated via GitHub Actions)
- [ ] Check error logs
- [ ] Verify backup completion

### Weekly

- [ ] Review system resource usage
- [ ] Clean Docker images and containers
- [ ] Update system packages
- [ ] Review security logs

### Monthly

- [ ] SSL certificate renewal check (automated)
- [ ] Performance review
- [ ] Backup restoration test
- [ ] Security audit

---

## Emergency Procedures

### Application Down

1. [ ] Check application logs: `docker logs nestjs-app`
2. [ ] Restart application: `docker-compose restart app`
3. [ ] Check system resources: `htop`, `df -h`
4. [ ] Rollback if necessary: restore from backup

### Database Issues

1. [ ] Check database logs: `docker logs postgres-db`
2. [ ] Verify database connectivity
3. [ ] Check disk space
4. [ ] Restore from backup if needed

### SSL Certificate Problems

1. [ ] Check certificate status: `certbot certificates`
2. [ ] Renew certificate: `certbot renew --force-renewal`
3. [ ] Restart Nginx: `docker-compose restart nginx`

---

## Contact Information

Fill in your deployment details:

| Item                   | Value              |
| ---------------------- | ------------------ |
| **Production VPS IP**  | ********\_******** |
| **Production Domain**  | ********\_******** |
| **Staging VPS IP**     | ********\_******** |
| **Staging Domain**     | ********\_******** |
| **GitHub Repository**  | ********\_******** |
| **Docker Hub Account** | ********\_******** |
| **SSL Email**          | ********\_******** |
| **Deployment Date**    | ********\_******** |

## Troubleshooting Contacts

| Issue Type            | Contact/Resource                        |
| --------------------- | --------------------------------------- |
| **VPS Provider**      | ********\_********                      |
| **Domain Registrar**  | ********\_********                      |
| **Technical Support** | ********\_********                      |
| **GitHub Issues**     | https://github.com/username/repo/issues |

---

## 🎉 Deployment Complete!

Once all items are checked:

✅ **Your NestJS Blog API is live and production-ready!**

**Next Steps:**

1. Monitor application performance
2. Set up additional monitoring tools (optional)
3. Plan for scaling as traffic grows
4. Regular maintenance and updates

**Useful Commands:**

- Health check: `curl https://yourdomain.com/health`
- View logs: `ssh root@YOUR_VPS_IP 'docker logs nestjs-app'`
- Update app: `./scripts/update.sh production yourdomain.com YOUR_VPS_IP`

For detailed commands, see [Quick Reference Guide](QUICK-REFERENCE.md).
