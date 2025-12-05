# Deployment Guide for CodeSyncPad on Render

## Why Render?

- **Free Tier**: 750 hours/month (enough for one service running 24/7)
- **Free PostgreSQL**: 90-day free PostgreSQL database (1GB storage, 1GB RAM)
- **Easy Setup**: Deploy directly from GitHub
- **Automatic SSL**: Free SSL certificates included
- **Good WebSocket Support**: Works well with Socket.io

## Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Render Account** - Sign up at https://render.com (free)

## Deployment Steps

### Option 1: Deploy via Blueprint (Easiest - One Click)

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Go to Render Dashboard**

   - Visit https://dashboard.render.com
   - Click "New +" → "Blueprint"

3. **Connect Repository**

   - Connect your GitHub account
   - Select your repository
   - Render will automatically detect `render.yaml`

4. **Initialize Database**

   - After deployment, go to your database in Render dashboard
   - Click "Connect" → "External Connection"
   - Copy the connection command or use the web shell
   - Run the schema initialization:

   ```sql
   -- Copy and paste contents from server/src/db/schema.sql
   ```

5. **Set CLIENT_URL**

   - Go to your web service in Render dashboard
   - Click "Environment" tab
   - Add environment variable:
     - Key: `CLIENT_URL`
     - Value: `https://your-app-name.onrender.com` (use your actual URL)
   - Click "Save Changes"

6. **Done!** Your app will be available at `https://your-app-name.onrender.com`

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `codesyncpad-db`
   - **Database**: `codesyncpad`
   - **User**: `codesyncpad` (or leave default)
   - **Region**: Oregon (closest to you)
   - **Plan**: Free
4. Click "Create Database"
5. Wait for provisioning (2-3 minutes)

#### Step 2: Initialize Database Schema

1. In your database dashboard, click "Connect"
2. Choose "External Connection" or use the PSQL Command
3. Copy and paste the contents of `server/src/db/schema.sql`
4. Or use this command from your terminal:
   ```bash
   # Get the external database URL from Render dashboard
   psql <EXTERNAL_DATABASE_URL> < server/src/db/schema.sql
   ```

#### Step 3: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:

   - **Name**: `codesyncpad` (or your preferred name)
   - **Region**: Oregon
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile.render`
   - **Plan**: Free

4. **Environment Variables** - Add these:

   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SESSION_TTL_HOURS` = `24`
   - `MAX_ACTIVE_USERS` = `50`
   - `EXECUTION_TIMEOUT_MS` = `5000`
   - `EXECUTION_MEMORY_LIMIT_MB` = `128`

5. **Add Database URL**:

   - Click "Add Environment Variable"
   - Key: `DATABASE_URL`
   - Click "Connect Database" button
   - Select your `codesyncpad-db` database
   - This auto-fills the connection string

6. **Add CLIENT_URL**:

   - Key: `CLIENT_URL`
   - Value: Will be `https://your-app-name.onrender.com`
   - (You can add this after deployment once you know the URL)

7. Click "Create Web Service"

#### Step 4: Wait for Deployment

- First build takes 5-10 minutes
- Watch the logs for any errors
- Once deployed, you'll see "Your service is live 🎉"

#### Step 5: Update CLIENT_URL

1. Copy your app's URL (e.g., `https://codesyncpad.onrender.com`)
2. Go to "Environment" tab
3. Update `CLIENT_URL` to your actual URL
4. Service will automatically redeploy

## Important Notes

### Free Tier Limitations

- **Sleep after inactivity**: Free services sleep after 15 minutes of inactivity
- **Cold start**: First request after sleep takes 30-60 seconds to wake up
- **750 hours/month**: Enough for one service running 24/7
- **Database**: Free for 90 days, then $7/month or expires

### WebSocket Considerations

- Render supports WebSockets on free tier ✅
- Connections may drop during sleep/wake cycle
- Your client should handle reconnection (already implemented in your code)

### Build Time

- Initial build: 5-10 minutes
- Subsequent builds: 2-5 minutes (with caching)

## Monitoring and Maintenance

### View Logs

1. Go to your service dashboard
2. Click "Logs" tab
3. See real-time logs

### Redeploy

- **Auto-deploy**: Enabled by default on git push
- **Manual deploy**: Click "Manual Deploy" → "Deploy latest commit"

### Database Management

1. Go to database dashboard
2. Click "Connect" for shell access
3. Or use external tools with the External Database URL

### Check Service Health

- Visit: `https://your-app.onrender.com/api/health`
- Should return: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

### Service Won't Start

- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correctly connected

### Database Connection Issues

- Verify database is running (not suspended)
- Check `DATABASE_URL` format includes `?sslmode=require`
- Free PostgreSQL requires SSL connection

### WebSocket Not Working

- Ensure nginx config proxies `/socket.io/` correctly
- Check browser console for WebSocket errors
- Render supports WebSocket by default, no special config needed

### Slow Cold Starts

- This is normal for free tier (15-minute sleep)
- Consider upgrading to paid plan ($7/month) for always-on service
- Or keep the service warm with an uptime monitor (like UptimeRobot)

## Upgrading from Free Tier

When your 90-day free database expires or you need better performance:

1. **Database**: Upgrade to Starter plan ($7/month)

   - 1GB RAM, 10GB storage
   - No sleep, always available

2. **Web Service**: Upgrade to Starter plan ($7/month)
   - 0.5 CPU, 512MB RAM
   - No sleep, always-on

**Total cost**: $14/month for production-ready hosting

## Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed
5. Free SSL certificate automatically provisioned

## Environment Variables Reference

| Variable                    | Required | Default         | Description                     |
| --------------------------- | -------- | --------------- | ------------------------------- |
| `NODE_ENV`                  | Yes      | `production`    | Node environment                |
| `PORT`                      | Yes      | `10000`         | Port for Render                 |
| `DATABASE_URL`              | Yes      | (from database) | PostgreSQL connection string    |
| `CLIENT_URL`                | Yes      | -               | Your app's public URL           |
| `SESSION_TTL_HOURS`         | No       | `24`            | Session lifetime                |
| `MAX_ACTIVE_USERS`          | No       | `50`            | Max concurrent users            |
| `EXECUTION_TIMEOUT_MS`      | No       | `5000`          | Code execution timeout          |
| `EXECUTION_MEMORY_LIMIT_MB` | No       | `128`           | Memory limit for code execution |

## Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://render.com/docs/databases
- **WebSocket Support**: https://render.com/docs/web-services#websocket-support

## Next Steps

After deployment:

1. Test all features (code editing, execution, real-time sync)
2. Share your app URL with others
3. Monitor logs for any errors
4. Consider setting up custom domain
5. Plan for database upgrade before 90-day free period ends
