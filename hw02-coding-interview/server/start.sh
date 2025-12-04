#!/bin/bash

# CollabCodePad Server Quick Start Script

echo "🚀 Starting CollabCodePad Server..."
echo ""

# Check if .env exists, if not create from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Run tests
echo "🧪 Running tests..."
npm test
echo ""

# Start server
echo "🎉 Starting development server..."
npm run dev
