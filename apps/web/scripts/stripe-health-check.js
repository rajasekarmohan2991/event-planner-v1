#!/usr/bin/env node

/**
 * Stripe Health Check Script
 * 
 * Verifies Stripe configuration and readiness for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  console.warn('Could not load .env file');
}

function checkStripeConfiguration() {
  console.log('🏥 Stripe Health Check for Event Planner\n');

  const checks = [];
  let allPassed = true;

  // Check 1: Environment Variables
  console.log('1️⃣ Checking environment variables...');
  
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${value.substring(0, 12)}...`);
      checks.push({ name: varName, status: 'pass' });
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      checks.push({ name: varName, status: 'fail' });
      allPassed = false;
    }
  });

  // Check 2: API Key Format Validation
  console.log('\n2️⃣ Validating API key formats...');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secretKey) {
    if (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) {
      console.log(`   ✅ Secret key format valid (${secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE'} mode)`);
    } else {
      console.log('   ❌ Secret key format invalid');
      allPassed = false;
    }
  }

  if (publishableKey) {
    if (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) {
      console.log(`   ✅ Publishable key format valid (${publishableKey.startsWith('pk_test_') ? 'TEST' : 'LIVE'} mode)`);
    } else {
      console.log('   ❌ Publishable key format invalid');
      allPassed = false;
    }
  }

  if (webhookSecret) {
    if (webhookSecret.startsWith('whsec_')) {
      console.log('   ✅ Webhook secret format valid');
    } else {
      console.log('   ❌ Webhook secret format invalid');
      allPassed = false;
    }
  }

  // Check 3: Key Mode Consistency
  console.log('\n3️⃣ Checking key mode consistency...');
  
  if (secretKey && publishableKey) {
    const secretIsTest = secretKey.startsWith('sk_test_');
    const publishableIsTest = publishableKey.startsWith('pk_test_');
    
    if (secretIsTest === publishableIsTest) {
      console.log(`   ✅ Keys are in same mode (${secretIsTest ? 'TEST' : 'LIVE'})`);
    } else {
      console.log('   ❌ Key mode mismatch (secret and publishable keys are in different modes)');
      allPassed = false;
    }
  }

  // Check 4: File Structure
  console.log('\n4️⃣ Checking Stripe integration files...');
  
  const requiredFiles = [
    'lib/stripe.ts',
    'app/api/payments/stripe/create-intent/route.ts',
    'app/api/payments/stripe/confirm/route.ts',
    'app/api/payments/stripe/webhook/route.ts',
    'app/api/payments/stripe/refund/route.ts'
  ];

  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${filePath}`);
    } else {
      console.log(`   ❌ ${filePath} - Missing`);
      allPassed = false;
    }
  });

  // Check 5: Package Dependencies
  console.log('\n5️⃣ Checking package dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (dependencies.stripe) {
      console.log(`   ✅ stripe package: ${dependencies.stripe}`);
    } else {
      console.log('   ❌ stripe package: Missing');
      allPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Could not read package.json');
    allPassed = false;
  }

  // Check 6: Environment Mode
  console.log('\n6️⃣ Checking environment mode...');
  
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === 'production';
  const usingTestKeys = secretKey && secretKey.startsWith('sk_test_');
  
  console.log(`   📊 NODE_ENV: ${nodeEnv || 'development'}`);
  console.log(`   🔑 Using ${usingTestKeys ? 'TEST' : 'LIVE'} keys`);
  
  if (isProduction && usingTestKeys) {
    console.log('   ⚠️  WARNING: Using test keys in production environment');
  } else if (!isProduction && !usingTestKeys) {
    console.log('   ⚠️  WARNING: Using live keys in development environment');
  } else {
    console.log('   ✅ Environment and key mode are appropriate');
  }

  // Summary
  console.log('\n📊 Health Check Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (allPassed) {
    console.log('🎉 All checks passed! Stripe integration is ready.');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (usingTestKeys) {
    console.log('🧪 TEST MODE - Safe for development and testing');
    console.log('   • Use test card numbers for payments');
    console.log('   • No real money will be processed');
    console.log('   • Webhook events are simulated');
  } else {
    console.log('🚀 LIVE MODE - Real payments will be processed');
    console.log('   • Ensure webhook endpoint is accessible');
    console.log('   • Monitor Stripe Dashboard for transactions');
    console.log('   • Have customer support ready');
  }

  console.log('\n🔗 Useful Links:');
  console.log('   • Stripe Dashboard: https://dashboard.stripe.com');
  console.log('   • API Keys: https://dashboard.stripe.com/apikeys');
  console.log('   • Webhooks: https://dashboard.stripe.com/webhooks');
  console.log('   • Test Cards: https://stripe.com/docs/testing#cards');

  return allPassed;
}

// CLI Usage - Always run when executed directly
const passed = checkStripeConfiguration();
if (import.meta.url.startsWith('file://')) {
  process.exit(passed ? 0 : 1);
}

export { checkStripeConfiguration };
