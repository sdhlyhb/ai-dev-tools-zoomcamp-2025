# Docker Compose Setup Guide

## 🐳 Quick Start

### Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine + Docker Compose (Linux)
- 4GB+ RAM available for Docker
- 5GB+ free disk space

### Start Everything

```bash
# From the project root (hw02-coding-interview/)
docker-compose up -d
```

That's it! The application will be available at **http://localhost**

## 📦 What's Running

| Service  | Container              | Port   | Description             |
| -------- | ---------------------- | ------ | ----------------------- |
| Frontend | `codesyncpad-frontend` | `80`   | Nginx serving React app |
| Backend  | `codesyncpad-backend`  | `3000` | Node.js API + WebSocket |
| Database | `codesyncpad-db`       | `5432` | PostgreSQL 15           |

## 🛠️ Common Commands

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d frontend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild and restart
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
```

### Check Service Status

```bash
# List running containers
docker-compose ps

# Check service health
docker-compose ps
```

### Access Services

```bash
# Execute command in backend container
docker-compose exec backend sh
docker-compose exec backend npm run test

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d codesyncpad

# View backend environment variables
docker-compose exec backend env
```

## 🌐 Access Points

- **Application**: http://localhost
- **API Health**: http://localhost/api/health
- **Backend Direct**: http://localhost:3000/api/health
- **PostgreSQL**: localhost:5432

## 🔧 Configuration

### Environment Variables

The default configuration is in `docker-compose.yml`. For custom settings:

1. Copy the example env file:

```bash
cp .env.docker.example .env
```

2. Edit `.env` with your values:

```env
POSTGRES_PASSWORD=your_secure_password
CLIENT_URL=http://your-domain.com
SESSION_TTL_HOURS=48
```

3. Restart services:

```bash
docker-compose down
docker-compose up -d
```

### Change Ports

Edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80" # Change 8080 to your preferred port

  backend:
    ports:
      - "4000:3000" # Change 4000 to your preferred port
```

## 🗄️ Database Management

### View Data

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d codesyncpad

# List tables
\dt

# View sessions
SELECT session_id, title, language, created_at FROM sessions;

# View active users
SELECT * FROM session_users;

# Exit psql
\q
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres codesyncpad > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres codesyncpad < backup.sql
```

### Reset Database

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## 🐛 Troubleshooting

### Port Already in Use

```
Error: bind: address already in use
```

**Solution:** Change ports in `docker-compose.yml` or stop the conflicting service.

```bash
# Check what's using port 80
lsof -i :80
sudo lsof -i :80  # macOS/Linux

# On Windows
netstat -ano | findstr :80
```

### Frontend 502 Bad Gateway

**Symptoms:** Frontend loads but API calls fail

**Solution:** Backend might not be ready yet

```bash
# Check backend health
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Database Connection Failed

```
Error: connect ECONNREFUSED postgres:5432
```

**Solution:** Wait for database to be ready

```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Restart with dependency check
docker-compose down && docker-compose up -d
```

### Out of Disk Space

```bash
# Remove unused images and containers
docker system prune -a

# Remove volumes (⚠️ deletes data)
docker system prune -a --volumes
```

### Changes Not Appearing

```bash
# Rebuild without cache
docker-compose build --no-cache

# Restart
docker-compose up -d --force-recreate
```

## 🚀 Production Deployment

### Security Checklist

1. **Change default password** in `docker-compose.yml`:

```yaml
POSTGRES_PASSWORD: your_very_secure_password_here
```

2. **Set NODE_ENV to production**:

```yaml
NODE_ENV: production
```

3. **Update CLIENT_URL** to your domain:

```yaml
CLIENT_URL: https://yourdomain.com
```

4. **Use secrets** instead of plain text passwords (Docker Swarm/Kubernetes)

5. **Enable SSL/TLS** with Let's Encrypt or your certificate

### Deploying to Cloud

**Option 1: Docker Swarm**

```bash
docker stack deploy -c docker-compose.yml codesyncpad
```

**Option 2: Kubernetes**

```bash
# Convert docker-compose to k8s
kompose convert
kubectl apply -f .
```

**Option 3: Cloud Platforms**

- **AWS ECS**: Use ECR + ECS with Fargate
- **Google Cloud Run**: Deploy each service separately
- **Azure Container Instances**: Use ACI + Azure Database for PostgreSQL
- **DigitalOcean**: Use App Platform or Kubernetes

### Performance Tuning

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
```

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats codesyncpad-backend
```

### Health Checks

Built-in health checks for all services:

```bash
# View health status
docker-compose ps

# Detailed health info
docker inspect codesyncpad-backend | grep -A 10 Health
```

## 🔄 Development Workflow

### Local Development with Hot Reload

For active development, use Docker for database only:

```bash
# Start only database
docker-compose up -d postgres

# Run backend locally
cd server
npm run dev

# Run frontend locally
cd client
npm run dev
```

Connect to Docker PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:postgres_password_change_in_production@localhost:5432/codesyncpad
```

### Test in Docker Environment

```bash
# Full Docker environment
docker-compose up -d

# Make changes
# ... edit code ...

# Rebuild and test
docker-compose build backend
docker-compose up -d backend
```

## 📁 Project Structure

```
hw02-coding-interview/
├── docker-compose.yml          # Orchestration config
├── .env.docker.example         # Environment template
├── client/
│   ├── Dockerfile             # Frontend build
│   ├── nginx.conf             # Nginx config
│   └── .dockerignore          # Build exclusions
└── server/
    ├── Dockerfile             # Backend build
    ├── .dockerignore          # Build exclusions
    └── src/db/schema.sql      # DB initialization
```

## 🎯 Next Steps

1. ✅ Start services: `docker-compose up -d`
2. ✅ Open http://localhost
3. ✅ Create a session and test collaboration
4. ✅ Check logs: `docker-compose logs -f`
5. ✅ Customize configuration as needed

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
