#!/bin/bash
# Railway start script

echo "🚀 Starting Budget App server..."

cd server

# Check if database is accessible
echo "🔍 Checking database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err))
  .finally(() => prisma.\$disconnect());
"

# Start the server
echo "🌟 Starting server..."
npm start
