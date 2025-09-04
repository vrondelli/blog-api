# NestJS Blog API

A production-ready NestJS blog API with automated deployment infrastructure using environment variables.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Configure your database connection and environment variables

# Run migrations
npx prisma migrate dev

# Start development server
pnpm run start:dev
```

### Production Deployment

**Prerequisites:**

- Ubuntu VPS (20.04+ recommended)
- Domain name pointing to your VPS
- SSH key configured for VPS access

**Option 1: Using Environment File (Recommended)**

```bash
# Create environment configuration
cp infrastructure/ansible/.env.template infrastructure/ansible/.env
# Edit .env with your VPS details

# Deploy the application
./scripts/deploy.sh --env-file infrastructure/ansible/.env
```

**Option 2: Using Command Line Arguments**

```bash
# Deploy with direct parameters
./scripts/deploy.sh production yourdomain.com YOUR_VPS_IP
```

**First-time Setup:** See [FIRST-TIME-SETUP.md](./FIRST-TIME-SETUP.md) for complete guide.

## 🏗️ Architecture

- **Framework:** NestJS v11.0.1 with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Redis
- **Infrastructure:** Docker + Docker Compose
- **Web Server:** Nginx with SSL (Let's Encrypt)
- **Deployment:** Ansible automation with environment variables
- **CI/CD:** GitHub Actions

## 📁 Project Structure

```
├── src/                           # Application source code
├── infrastructure/                # Infrastructure as Code (Ansible)
│   └── ansible/                   # Ansible configuration
│       ├── .env.template          # Environment variables template
│       ├── inventory/hosts.yml    # Dynamic inventory (uses env vars)
│       ├── playbooks/             # Ansible playbooks
│       └── roles/                 # Ansible roles
├── .github/workflows/             # CI/CD pipelines
├── scripts/                       # Deployment scripts
│   ├── deploy.sh                  # Deploy application
│   ├── update.sh                  # Update application
│   └── load-env.sh                # Load environment variables
├── docker/                        # Docker configurations
└── test/                          # Test files
```

## 🛠️ Environment Variables

The deployment system now uses environment variables for all configuration. This eliminates the need to manually edit inventory files.

### Quick Setup

```bash
# Create your environment file
cp infrastructure/ansible/.env.template infrastructure/ansible/.env

# Edit with your values
vim infrastructure/ansible/.env

# Validate configuration
./scripts/load-env.sh

# Deploy
./scripts/deploy.sh --env-file infrastructure/ansible/.env
```

### Required Variables

- `VPS_HOST` - Your VPS IP address
- `DOMAIN_NAME` - Your domain name
- `GIT_REPO_URL` - Git repository URL

### Optional Variables (with defaults)

- `VPS_USER` - SSH username (default: root)
- `SSH_PRIVATE_KEY_FILE` - SSH key path (default: ~/.ssh/blog_api_deploy)
- `SSL_EMAIL` - Email for SSL certificates (default: admin@domain)
- `GIT_BRANCH` - Git branch to deploy (default: main)

See [infrastructure/ansible/README.md](./infrastructure/ansible/README.md) for complete variable reference.

## 🔧 Available Scripts

- `load-env.sh` - Load and validate environment variables
- `deploy.sh` - Initial deployment or full redeploy
- `update.sh` - Update deployed application

### Usage Examples

```bash
# Load environment and validate
./scripts/load-env.sh

# Deploy with environment file
./scripts/deploy.sh --env-file infrastructure/ansible/.env

# Deploy with command line
./scripts/deploy.sh production example.com 1.2.3.4

# Update with environment file
./scripts/update.sh --env-file infrastructure/ansible/.env

# Update with command line
./scripts/update.sh production example.com 1.2.3.4 main
```

## 🚀 Deployment Options

### 1. Automated (GitHub Actions)

Push to `main` branch triggers automatic deployment.

**Required GitHub Secrets:**

- `VPS_HOST` - Your VPS IP address
- `VPS_USER` - SSH username (usually 'root')
- `VPS_SSH_KEY` - Private SSH key for VPS access
- `DOMAIN_NAME` - Your domain name
- `SSL_EMAIL` - Email for SSL certificates

### 2. Manual Deployment

```bash
# Deploy via GitHub Actions (manual trigger)
gh workflow run manual-deploy.yml

# Or deploy directly from local machine
./scripts/deploy.sh --env-file infrastructure/ansible/.env
```

## 🔍 Monitoring & Health Checks

- **Health Check Endpoint:** `GET /health`
- **Automated Health Checks:** GitHub Actions workflow
- **Logs:** `docker-compose logs -f api`

## 📊 Database Management

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View data (Prisma Studio)
npx prisma studio
```

## 🛡️ Security Features

- SSH key-based authentication
- UFW firewall configuration
- Fail2ban intrusion prevention
- SSL/TLS encryption (Let's Encrypt)
- Docker container isolation
- Environment variable isolation

## 🔧 Troubleshooting

### Environment Variable Issues

```bash
# Validate environment configuration
./scripts/load-env.sh

# Check Ansible variable resolution
cd infrastructure/ansible
ansible all -i inventory/hosts.yml -m debug -a "var=domain_name"
```

### Deployment Issues

```bash
# Check deployment logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
./scripts/deploy.sh --env-file infrastructure/ansible/.env
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Manually renew certificates
sudo certbot renew
```

### Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

## 📚 Documentation

- [First-time Setup Guide](./FIRST-TIME-SETUP.md) - Complete setup instructions
- [Infrastructure Documentation](./infrastructure/README.md) - Ansible and infrastructure details
- [Environment Variables Guide](./infrastructure/ansible/README.md) - Environment configuration reference

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
