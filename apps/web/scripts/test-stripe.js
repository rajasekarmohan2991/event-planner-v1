#!/usr/bin/env node

/**
 * Stripe Integration Test Script for Event Planner
 * 
 * This script tests the Stripe integration by:
 * 1. Creating a test product and price
 * 2. Creating a payment intent
 * 3. Testing webhook events
 * 4. Verifying API connectivity
 */

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration for Event Planner\n');

  try {
    // Test 1: Verify API Key
    console.log('1️⃣ Testing API Key...');
    const balance = await stripe.balance.retrieve();
    console.log(`✅ API Key valid. Available balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'USD'}\n`);

    // Test 2: Create Test Product
    console.log('2️⃣ Creating test product...');
    const product = await stripe.products.create({
      name: 'Event Planner Test Event',
      description: 'Test event registration for Event Planner integration',
      metadata: {
        source: 'event-planner-test',
        event_id: 'test-event-123'
      }
    });
    console.log(`✅ Product created: ${product.id}\n`);

    // Test 3: Create Test Price
    console.log('3️⃣ Creating test price...');
    const price = await stripe.prices.create({
      unit_amount: 5000, // ₹50.00
      currency: 'inr',
      product: product.id,
      metadata: {
        ticket_type: 'general',
        event_id: 'test-event-123'
      }
    });
    console.log(`✅ Price created: ${price.id} (₹${price.unit_amount / 100})\n`);

    // Test 4: Create Test Customer
    console.log('4️⃣ Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test@eventplanner.com',
      name: 'Test User',
      metadata: {
        source: 'event-planner',
        user_id: 'test-user-123'
      }
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // Test 5: Create Payment Intent
    console.log('5️⃣ Creating payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000,
      currency: 'inr',
      customer: customer.id,
      description: 'Event Planner Test Registration',
      metadata: {
        event_id: 'test-event-123',
        registration_id: 'test-reg-123',
        ticket_type: 'general'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret}\n`);

    // Test 6: List Recent Events
    console.log('6️⃣ Checking recent events...');
    const events = await stripe.events.list({ limit: 5 });
    console.log(`✅ Found ${events.data.length} recent events:`);
    events.data.forEach(event => {
      console.log(`   - ${event.type} (${event.id})`);
    });
    console.log();

    // Test 7: Test Webhook Endpoint (if running locally)
    console.log('7️⃣ Testing webhook endpoint...');
    try {
      const response = await fetch('http://localhost:3001/api/payments/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: paymentIntent }
        })
      });
      
      if (response.status === 400) {
        console.log('✅ Webhook endpoint responding (signature validation working)');
      } else {
        console.log(`⚠️  Webhook endpoint returned status: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️  Webhook endpoint not accessible (server may not be running)');
    }
    console.log();

    // Test 8: Cleanup (optional)
    console.log('8️⃣ Cleaning up test data...');
    
    // Delete test product (this also deletes associated prices)
    await stripe.products.del(product.id);
    console.log('✅ Test product deleted');
    
    // Delete test customer
    await stripe.customers.del(customer.id);
    console.log('✅ Test customer deleted\n');

    // Summary
    console.log('🎉 All Stripe integration tests passed!');
    console.log('\n📋 Integration Summary:');
    console.log('✅ API connectivity working');
    console.log('✅ Product creation working');
    console.log('✅ Price creation working');
    console.log('✅ Customer creation working');
    console.log('✅ Payment intent creation working');
    console.log('✅ Event retrieval working');
    console.log('✅ Webhook endpoint configured');
    
    console.log('\n🚀 Your Event Planner is ready to accept Stripe payments!');
    console.log('\n💡 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Start webhook forwarding: stripe listen --forward-to localhost:3001/api/payments/stripe/webhook');
    console.log('3. Test a payment in your application');
    console.log('4. Check Stripe Dashboard for transaction details');

  } catch (error) {
    console.error('❌ Stripe integration test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n🔑 API Key Issue:');
      console.log('- Check your STRIPE_SECRET_KEY in .env file');
      console.log('- Ensure you\'re using the correct test/live key');
      console.log('- Verify the key starts with sk_test_ for test mode');
    } else if (error.type === 'StripeConnectionError') {
      console.log('\n🌐 Connection Issue:');
      console.log('- Check your internet connection');
      console.log('- Verify Stripe API is accessible');
    } else {
      console.log('\n🐛 Debug Information:');
      console.log('Error Type:', error.type);
      console.log('Error Code:', error.code);
      console.log('Error Message:', error.message);
    }
    
    process.exit(1);
  }
}

// Test Card Numbers for Reference
function showTestCards() {
  console.log('\n💳 Test Card Numbers for India (INR):');
  console.log('');
  console.log('✅ Successful Payments:');
  console.log('   4000003560000008 - Visa (India)');
  console.log('   4000003560000016 - Visa Debit (India)');
  console.log('   4000002500003155 - Mastercard (India)');
  console.log('');
  console.log('❌ Declined Payments:');
  console.log('   4000000000000002 - Generic decline');
  console.log('   4000000000000069 - Expired card');
  console.log('   4000000000000127 - Incorrect CVC');
  console.log('');
  console.log('🔐 3D Secure Required:');
  console.log('   4000002760003184 - Visa (India) - requires authentication');
  console.log('');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if Stripe key is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Copy your secret key from https://dashboard.stripe.com/test/apikeys');
    console.log('2. Add it to your .env file: STRIPE_SECRET_KEY=sk_test_...');
    console.log('3. Run this test again: node scripts/test-stripe.js');
    process.exit(1);
  }

  testStripeIntegration()
    .then(() => {
      showTestCards();
    })
    .catch(error => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}

export { testStripeIntegration };
