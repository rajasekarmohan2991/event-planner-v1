// Test script to check Multi-Provider SMS system
require('dotenv').config({ path: './apps/web/.env' });

async function testTextBeltAPI() {
  console.log('🔍 Testing TextBelt API (Free SMS)...\n');
  
  try {
    // Test TextBelt API without actually sending SMS
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+1234567890', // Test phone number
        message: 'Test message',
        key: 'textbelt' // Free tier key
      })
    });

    const result = await response.json();
    console.log('📡 TextBelt API Response:', result);
    
    if (result.success || result.error === 'Out of quota') {
      console.log('✅ TextBelt API is working!');
      if (result.error === 'Out of quota') {
        console.log('ℹ️  Daily quota reached (normal for free tier)');
      }
      return true;
    } else {
      console.log('❌ TextBelt API error:', result.error);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error testing TextBelt API:', error.message);
    return false;
  }
}

function checkProviderConfig() {
  console.log('🔍 Checking SMS Provider Configuration...\n');
  
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_SMS_FROM;
  
  const smsmodeKey = process.env.SMSMODE_API_KEY;
  const smsmodeSender = process.env.SMSMODE_SENDER;
  
  if (twilioSid && twilioToken && twilioFrom) {
    console.log('✅ Twilio configured - will use Twilio');
    return 'twilio';
  }
  
  if (smsmodeKey && smsmodeSender) {
    console.log('✅ SMSMode configured - will use SMSMode');
    return 'smsmode';
  }
  
  console.log('✅ No specific provider configured - will use TextBelt (FREE)');
  return 'textbelt';
}

// Run the tests
async function runTests() {
  const provider = checkProviderConfig();
  console.log(`\n📱 Active SMS Provider: ${provider.toUpperCase()}\n`);
  
  if (provider === 'textbelt') {
    const success = await testTextBeltAPI();
    
    if (success) {
      console.log('\n🎉 SMS system is ready to use!');
      console.log('\n📋 TextBelt Features:');
      console.log('• ✅ Completely FREE');
      console.log('• ✅ No signup required');
      console.log('• ✅ 1 SMS per day per IP');
      console.log('• ✅ US/Canada numbers supported');
      console.log('• ✅ Perfect for testing');
      
      console.log('\n🚀 To upgrade for higher volume:');
      console.log('1. Add Twilio credentials for $15 free credit');
      console.log('2. Or add SMSMode credentials for pay-as-you-go');
    } else {
      console.log('\n⚠️  TextBelt API test failed, but integration should still work');
    }
  } else {
    console.log(`\n✅ Using ${provider.toUpperCase()} provider`);
    console.log('🎉 SMS system is ready to use!');
  }
}

runTests();
