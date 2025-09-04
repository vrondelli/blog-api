# Environment Variable Configuration

This directory contains configuration files for dynamic Ansible deployments using environment variables.

## 🚀 Quick Start

### Method 1: Using Environment File (Recommended)

1. **Create your environment file:**

   ```bash
   cp .env.template .env
   ```

2. **Edit the .env file with your values:**

   ```bash
   vim .env  # or your preferred editor
   ```

3. **Deploy using environment file:**
   ```bash
   # From project root
   ./scripts/deploy.sh --env-file infrastructure/ansible/.env
   ./scripts/update.sh --env-file infrastructure/ansible/.env
   ```

### Method 2: Using Command Line Arguments

```bash
# Deploy with command line arguments
./scripts/deploy.sh production yourdomain.com 1.2.3.4

# Update with command line arguments
./scripts/update.sh production yourdomain.com 1.2.3.4 main
```

### Method 3: Export Environment Variables

```bash
# Export variables manually
export VPS_HOST=1.2.3.4
export DOMAIN_NAME=yourdomain.com
export GIT_REPO_URL=git@github.com:yourusername/blog-api.git

# Then run deployment
./scripts/deploy.sh --env-file
```

## 📁 Files

- **`.env.template`** - Template file with all available environment variables
- **`.env`** - Your actual environment file (create from template)
- **`hosts.yml`** - Dynamic inventory file that reads environment variables
- **`hosts.yml.template`** - Template showing all available variable lookups

## 🔧 Environment Variables

### Required Variables

| Variable       | Description         | Example                        |
| -------------- | ------------------- | ------------------------------ |
| `VPS_HOST`     | Your VPS IP address | `167.172.123.45`               |
| `DOMAIN_NAME`  | Your domain name    | `yourdomain.com`               |
| `GIT_REPO_URL` | Git repository URL  | `git@github.com:user/repo.git` |

### Optional Variables (with defaults)

| Variable                 | Default                  | Description                |
| ------------------------ | ------------------------ | -------------------------- |
| `VPS_USER`               | `root`                   | SSH username               |
| `SSH_PRIVATE_KEY_FILE`   | `~/.ssh/blog_api_deploy` | SSH private key path       |
| `SSL_EMAIL`              | `admin@{DOMAIN_NAME}`    | Email for SSL certificates |
| `GIT_BRANCH`             | `main`                   | Git branch to deploy       |
| `ENVIRONMENT`            | `production`             | Deployment environment     |
| `APP_NAME`               | `nestjs-blog-api`        | Application name           |
| `APP_PORT`               | `3000`                   | Application port           |
| `APP_USER`               | `deploy`                 | Application user           |
| `POSTGRES_DB`            | `blog_db`                | Database name              |
| `POSTGRES_USER`          | `blog_user`              | Database user              |
| `POSTGRES_VERSION`       | `15`                     | PostgreSQL version         |
| `REDIS_PORT`             | `6379`                   | Redis port                 |
| `DOCKER_COMPOSE_VERSION` | `2.21.0`                 | Docker Compose version     |
| `USE_SSL`                | `true`                   | Enable SSL certificates    |
| `SSL_PROVIDER`           | `letsencrypt`            | SSL certificate provider   |

## 🛠️ Helper Scripts

### Load and Validate Environment

```bash
# Load environment variables and validate
./scripts/load-env.sh

# Load from specific file
./scripts/load-env.sh path/to/custom/.env

# Source in current shell
source ./scripts/load-env.sh
```

### Check Current Configuration

```bash
# Show current environment configuration
./scripts/load-env.sh
```

## 📝 Example .env File

```bash
# VPS Configuration
VPS_HOST=167.172.123.45
VPS_USER=root
SSH_PRIVATE_KEY_FILE=~/.ssh/blog_api_deploy

# Domain Configuration
DOMAIN_NAME=myblog.com
SSL_EMAIL=admin@myblog.com

# Git Repository
GIT_REPO_URL=git@github.com:myuser/blog-api.git
GIT_BRANCH=main

# Environment
ENVIRONMENT=production

# Optional customizations
APP_NAME=my-blog-api
POSTGRES_DB=my_blog_db
```

## 🔄 Migration from Old System

If you're migrating from the old hardcoded inventory system:

1. **Backup your old inventory:**

   ```bash
   cp hosts.yml hosts.yml.backup
   ```

2. **Create environment file:**

   ```bash
   cp .env.template .env
   ```

3. **Transfer your values:**
   - Copy `ansible_host` → `VPS_HOST`
   - Copy `domain_name` → `DOMAIN_NAME`
   - Copy `git_repo_url` → `GIT_REPO_URL`
   - etc.

4. **Test the new system:**
   ```bash
   ./scripts/load-env.sh
   ```

## 🚨 Security Notes

- **Never commit .env files** - they contain sensitive information
- **Use strong SSH keys** - preferably 4096-bit RSA or ED25519
- **Restrict SSH key permissions:** `chmod 600 ~/.ssh/blog_api_deploy`
- **Use different SSH keys** for different environments

## 🐛 Troubleshooting

### Environment Variables Not Loading

```bash
# Check if .env file exists
ls -la infrastructure/ansible/.env

# Validate environment variables
./scripts/load-env.sh

# Check for syntax errors in .env
cat infrastructure/ansible/.env | grep -v '^#' | grep '='
```

### Ansible Can't Find Variables

```bash
# Test Ansible variable resolution
cd infrastructure/ansible
ansible all -i inventory/hosts.yml -m debug -a "var=domain_name"
```

### SSH Connection Issues

```bash
# Test SSH connection manually
ssh -i ~/.ssh/blog_api_deploy root@$VPS_HOST

# Check SSH key permissions
ls -la ~/.ssh/blog_api_deploy*
```

## 💡 Tips

- **Use descriptive values** in your .env file comments
- **Keep multiple .env files** for different environments (staging, production)
- **Use the load-env.sh script** to validate before deployment
- **Set up proper SSH key management** for secure deployments
