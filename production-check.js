#!/usr/bin/env node

/**
 * Production Readiness Check
 * Verifies if the Budget App is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking production readiness for Budget App v1.0...\n');

const checks = [];

// Check 1: Required files exist
const requiredFiles = [
  'package.json',
  'client/package.json',
  'server/package.json',
  'server/prisma/schema.prisma',
  '.env.example',
  'RAILWAY_DEPLOY.md',
  'railway.toml'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checks.push({ name: `✅ ${file} exists`, status: 'pass' });
  } else {
    checks.push({ name: `❌ ${file} missing`, status: 'fail' });
  }
});

// Check 2: Package.json scripts
const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));

const requiredRootScripts = ['build:production', 'start:production'];
const requiredServerScripts = ['build', 'start', 'railway:start', 'prisma:migrate:deploy'];
const requiredClientScripts = ['build', 'preview'];

requiredRootScripts.forEach(script => {
  if (rootPackage.scripts && rootPackage.scripts[script]) {
    checks.push({ name: `✅ Root script '${script}' configured`, status: 'pass' });
  } else {
    checks.push({ name: `❌ Root script '${script}' missing`, status: 'fail' });
  }
});

requiredServerScripts.forEach(script => {
  if (serverPackage.scripts && serverPackage.scripts[script]) {
    checks.push({ name: `✅ Server script '${script}' configured`, status: 'pass' });
  } else {
    checks.push({ name: `❌ Server script '${script}' missing`, status: 'fail' });
  }
});

requiredClientScripts.forEach(script => {
  if (clientPackage.scripts && clientPackage.scripts[script]) {
    checks.push({ name: `✅ Client script '${script}' configured`, status: 'pass' });
  } else {
    checks.push({ name: `❌ Client script '${script}' missing`, status: 'fail' });
  }
});

// Check 3: Node version
if (rootPackage.engines && rootPackage.engines.node) {
  checks.push({ name: `✅ Node.js version specified (${rootPackage.engines.node})`, status: 'pass' });
} else {
  checks.push({ name: `❌ Node.js version not specified`, status: 'fail' });
}

// Check 4: TypeScript configuration
if (fs.existsSync('server/tsconfig.json')) {
  checks.push({ name: `✅ Server TypeScript configured`, status: 'pass' });
} else {
  checks.push({ name: `❌ Server TypeScript not configured`, status: 'fail' });
}

if (fs.existsSync('client/tsconfig.json')) {
  checks.push({ name: `✅ Client TypeScript configured`, status: 'pass' });
} else {
  checks.push({ name: `❌ Client TypeScript not configured`, status: 'fail' });
}

// Display results
console.log('Production Readiness Results:');
console.log('================================\n');

checks.forEach(check => {
  console.log(check.name);
});

const passed = checks.filter(c => c.status === 'pass').length;
const failed = checks.filter(c => c.status === 'fail').length;

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 Budget App v1.0 is ready for production deployment!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: node deploy-setup.js');
  console.log('2. Create Railway account: https://railway.app');
  console.log('3. Connect your GitHub repository');
  console.log('4. Add PostgreSQL addon');
  console.log('5. Configure environment variables');
  console.log('6. Deploy automatically!');
} else {
  console.log('\n⚠️  Please fix the failed checks before deploying to production.');
  process.exit(1);
}
