#!/usr/bin/env node

/**
 * Railway Deployment Setup Script
 * This script prepares the Budget App for Railway deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing Budget App for Railway deployment...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('client') || !fs.existsSync('server')) {
    console.error('❌ Please run this script from the budget app root directory');
    process.exit(1);
}

try {
    // 1. Install dependencies
    console.log('📦 Installing server dependencies...');
    execSync('cd server && npm ci', { stdio: 'inherit' });

    console.log('📦 Installing client dependencies...');
    execSync('cd client && npm ci', { stdio: 'inherit' });

    // 2. Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('cd server && npx prisma generate', { stdio: 'inherit' });

    // 3. Build server
    console.log('🏗️ Building server...');
    execSync('cd server && npm run build', { stdio: 'inherit' });

    // 4. Build client
    console.log('🏗️ Building client...');
    execSync('cd client && npm run build', { stdio: 'inherit' });

    console.log('\n✅ Build completed successfully!');
    console.log('\n📋 Next steps for Railway deployment:');
    console.log('1. Go to https://railway.app and create an account');
    console.log('2. Connect your GitHub repository');
    console.log('3. Add a PostgreSQL database addon');
    console.log('4. Set the following environment variables:');
    console.log('   - JWT_SECRET=your_secure_32_character_secret');
    console.log('   - CORS_ORIGIN=https://your-app-name.railway.app');
    console.log('   - NODE_ENV=production');
    console.log('5. Deploy will happen automatically!');
    console.log('\n🎉 Your Budget App is ready for production!');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
