# GitHub Actions Workflows Summary

## 🔄 Workflow Status

[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/blog-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/blog-api/actions/workflows/ci-cd.yml)
[![Health Check](https://github.com/YOUR_USERNAME/blog-api/actions/workflows/health-check.yml/badge.svg)](https://github.com/YOUR_USERNAME/blog-api/actions/workflows/health-check.yml)

## 📋 Available Workflows

| Workflow               | Trigger              | Status                                                           | Description                      |
| ---------------------- | -------------------- | ---------------------------------------------------------------- | -------------------------------- |
| **CI/CD Pipeline**     | Push to main/develop | ![CI/CD](https://img.shields.io/badge/status-active-green)       | Automated testing and deployment |
| **Manual Deploy**      | Workflow dispatch    | ![Manual](https://img.shields.io/badge/status-ready-blue)        | Deploy specific branch/tag       |
| **Database Migration** | Workflow dispatch    | ![DB](https://img.shields.io/badge/status-ready-blue)            | Safe database operations         |
| **Health Check**       | Schedule/Manual      | ![Health](https://img.shields.io/badge/status-monitoring-orange) | Application monitoring           |

## 🚀 Quick Actions

### Deploy to Production

```bash
# Trigger via GitHub CLI
gh workflow run manual-deploy.yml -f environment=production -f branch=main

# Or go to GitHub Actions → Manual Deploy → Run workflow
```

### Deploy to Staging

```bash
# Trigger via GitHub CLI
gh workflow run manual-deploy.yml -f environment=staging -f branch=develop

# Or push to develop branch for automatic deployment
git push origin develop
```

### Run Database Migration

```bash
# Deploy migrations
gh workflow run db-migration.yml -f environment=production -f migration_type=deploy

# Seed database
gh workflow run db-migration.yml -f environment=production -f migration_type=seed
```

### Check Application Health

```bash
# Manual health check
gh workflow run health-check.yml -f environment=both

# Or view automatic checks every 15 minutes
```

## 📊 Deployment Metrics

Track your deployment success:

- **Deployment Frequency**: View in Actions tab
- **Success Rate**: Check workflow run history
- **Health Status**: Monitor via health check workflow
- **Performance**: Use performance check workflow

## 🔧 Workflow Configuration

Each workflow can be customized by editing files in `.github/workflows/`:

- `ci-cd.yml` - Main pipeline configuration
- `manual-deploy.yml` - Manual deployment settings
- `db-migration.yml` - Database operation settings
- `health-check.yml` - Monitoring configuration

## 🚨 Troubleshooting

### Common Issues

1. **Workflow fails with SSH error**
   - Check SSH_PRIVATE_KEY secret
   - Verify server access

2. **Health check fails**
   - Check application logs
   - Verify domain configuration

3. **Database migration fails**
   - Check database connectivity
   - Verify migration files

### Getting Help

- View workflow logs in GitHub Actions tab
- Check [CI/CD documentation](.github/README.md)
- Create an issue for support

## 🎯 Next Steps

1. **Customize workflows** for your specific needs
2. **Add more environments** (QA, development)
3. **Integrate notifications** (Slack, email)
4. **Add performance testing** to the pipeline
5. **Set up monitoring dashboards**

---

_Last updated: $(date)_
