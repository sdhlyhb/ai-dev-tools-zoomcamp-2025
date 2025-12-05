#!/bin/sh

# Start script for Fly.io deployment
# Starts both Nginx (frontend) and Node.js (backend)

# Start nginx in the background
nginx

# Start the Node.js backend (this runs in the foreground)
cd /app/server && node src/index.js
