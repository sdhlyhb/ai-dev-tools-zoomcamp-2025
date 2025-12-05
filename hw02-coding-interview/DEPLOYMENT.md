# Deployment Guide for CodeSyncPad on Fly.io

## Prerequisites

1. **Install Fly.io CLI**

   ```bash
   # macOS
   brew install flyctl

   # Or use install script
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up / Login to Fly.io**
   ```bash
   flyctl auth signup  # or flyctl auth login
   ```

## Deployment Steps

### 1. Create Fly.io App

```bash
# Navigate to project directory
cd hw02-coding-interview

# Launch the app (this creates it on Fly.io)
flyctl launch --no-deploy
```

When prompted:

- Choose your app name (or use suggested: `codesyncpad`)
- Select region closest to you (e.g., `sjc` for San Jose)
- Don't add PostgreSQL yet (we'll do it manually)
- Don't deploy yet (answer 'No')

### 2. Create PostgreSQL Database

```bash
# Create a Postgres cluster (Development size)
flyctl postgres create --name codesyncpad-db --region sjc

# Connect your app to the database
flyctl postgres attach codesyncpad-db -a codesyncpad
```

This automatically sets the `DATABASE_URL` secret for your app.

### 3. Initialize Database Schema

```bash
# Connect to your database
flyctl postgres connect -a codesyncpad-db

# In the psql prompt, copy and paste the contents of server/src/db/schema.sql
# Or you can do it in one command:
flyctl postgres connect -a codesyncpad-db < server/src/db/schema.sql
```

### 4. Set Environment Variables

```bash
# The DATABASE_URL is already set by the postgres attach command
# Set the CLIENT_URL to your Fly.io app URL
flyctl secrets set CLIENT_URL=https://codesyncpad.fly.dev -a codesyncpad

# Optional: Set other environment variables if needed
flyctl secrets set SESSION_TTL_HOURS=24 -a codesyncpad
```

### 5. Deploy

```bash
# Deploy your app
flyctl deploy
```

### 6. Open Your App

```bash
# Open in browser
flyctl open

# Check status
flyctl status

# View logs
flyctl logs
```

## Monitoring and Maintenance

### Check App Status

```bash
flyctl status
```

### View Logs

```bash
# Real-time logs
flyctl logs

# Last 100 lines
flyctl logs --tail=100
```

### Scale Your App

```bash
# Scale to 2 VMs
flyctl scale count 2

# Scale memory
flyctl scale memory 1024
```

### Database Management

```bash
# Connect to database
flyctl postgres connect -a codesyncpad-db

# View database info
flyctl postgres db list -a codesyncpad-db

# Create backup
flyctl postgres backup list -a codesyncpad-db
```

## Costs

**Free Tier Includes:**

- 3 shared-cpu-1x VMs with 256MB RAM each
- 3GB persistent volume storage
- 160GB outbound data transfer

**Your Setup:**

- App: 1 VM (512MB RAM) - Uses free allowance or ~$2/month
- PostgreSQL: Development size - ~$2/month or free on hobby plan
- **Total: ~$0-4/month** depending on usage

## Troubleshooting

### App Won't Start

```bash
# Check logs
flyctl logs

# SSH into the machine
flyctl ssh console

# Check processes
ps aux
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
flyctl secrets list

# Test database connection
flyctl postgres connect -a codesyncpad-db
```

### WebSocket Issues

- Ensure your fly.toml has `force_https = true`
- Check that nginx is proxying WebSocket correctly
- View nginx logs: `flyctl ssh console`, then `cat /var/log/nginx/error.log`

### Redeploy After Changes

```bash
# Just run deploy again
flyctl deploy

# Force rebuild
flyctl deploy --force-rebuild
```

## Custom Domain (Optional)

```bash
# Add your custom domain
flyctl certs add yourdomain.com

# Follow the instructions to add DNS records
flyctl certs show yourdomain.com
```

## Environment-Specific Notes

- **NODE_ENV**: Automatically set to `production`
- **PORT**: Set to `8080` in fly.toml
- **DATABASE_URL**: Automatically set when attaching Postgres
- **CLIENT_URL**: Set to your Fly.io app URL (e.g., https://codesyncpad.fly.dev)

## Rolling Back

```bash
# List releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

## Useful Commands

```bash
# SSH into your app
flyctl ssh console

# Restart app
flyctl apps restart

# View app info
flyctl info

# Open dashboard
flyctl dashboard
```
