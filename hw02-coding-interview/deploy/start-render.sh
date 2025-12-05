#!/bin/sh

# Start script for Render deployment
# Starts both Nginx (frontend) and Node.js (backend)

echo "Starting CodeSyncPad on Render..."

# Start nginx in the background
echo "Starting Nginx..."
nginx

# Wait a moment for nginx to start
sleep 2

# Start the Node.js backend (this runs in the foreground)
echo "Starting Node.js backend..."
cd /app/server && node src/index.js
