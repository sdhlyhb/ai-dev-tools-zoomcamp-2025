# Database Setup Guide

## PostgreSQL with Supabase (Recommended)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the database to be provisioned (2-3 minutes)
4. Go to **Settings** → **Database** and copy your **Connection String**

### 2. Set Up Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
```

Replace `[YOUR-PASSWORD]` and `[YOUR-HOST]` with your Supabase credentials.

### 3. Initialize the Database

The schema will be automatically initialized when you start the server for the first time.

Alternatively, you can manually run the schema:

```bash
# Using psql
psql $DATABASE_URL -f src/db/schema.sql

# Or using Supabase SQL Editor
# Copy contents of src/db/schema.sql and run in Supabase dashboard
```

### 4. Start the Server

```bash
npm start
```

You should see:

```
✅ Database connected successfully
✅ Database schema initialized
✅ Database initialized
🚀 CollabCodePad Server
```

## Alternative: Local PostgreSQL

### 1. Install PostgreSQL

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Create database
createdb codesyncpad

# Or using psql
psql postgres
CREATE DATABASE codesyncpad;
\q
```

### 3. Set Up Environment

Update `.env`:

```env
DATABASE_URL=postgresql://localhost:5432/codesyncpad
```

### 4. Run Migrations

```bash
psql codesyncpad -f src/db/schema.sql
```

## Database Schema

### Tables

**sessions**

- `id` - Auto-incrementing primary key
- `session_id` - Unique session identifier (12 chars)
- `language` - Programming language (javascript/python)
- `code` - Code content (TEXT)
- `title` - Session title
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)
- `expires_at` - Expiration timestamp

**session_users**

- `id` - Auto-incrementing primary key
- `session_id` - Foreign key to sessions
- `user_id` - User identifier (from localStorage)
- `joined_at` - Join timestamp

### Features

- Automatic `updated_at` timestamp updates via trigger
- Cascading deletes (deleting a session removes all its users)
- Cleanup function for expired sessions (runs hourly)
- Indexes on frequently queried columns

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED
```

**Solution:** Check if PostgreSQL is running and DATABASE_URL is correct.

### Authentication Failed

```
Error: password authentication failed
```

**Solution:** Verify your database password in DATABASE_URL.

### SSL Error (Supabase)

```
Error: self signed certificate
```

**Solution:** Already handled in code. If issues persist, add `?sslmode=require` to DATABASE_URL.

### Schema Already Exists

```
ERROR:  relation "sessions" already exists
```

**Solution:** This is normal on subsequent starts. The schema uses `CREATE TABLE IF NOT EXISTS`.

## Migration from Mock Database

All existing functionality works the same way. The only differences:

1. **Data persists** across server restarts
2. **Async operations** - All database methods return Promises
3. **Better scalability** - Can handle many concurrent users
4. **Production ready** - Can deploy to any cloud platform

## Deployment

### Supabase + Railway/Render

1. Push code to GitHub
2. Connect Railway/Render to your repo
3. Add `DATABASE_URL` environment variable
4. Deploy

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-supabase-or-production-db-url
CLIENT_URL=https://your-frontend-domain.com
```

## Performance Tips

1. **Connection Pooling**: Already configured (max 20 connections)
2. **Indexes**: Already created on frequently queried columns
3. **Cleanup Job**: Automatically removes expired sessions every hour
4. **Query Optimization**: Uses efficient JOIN queries for active user counts
