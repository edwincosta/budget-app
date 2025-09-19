#!/bin/bash
# Railway build script

echo "🚀 Starting Railway build process..."

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
