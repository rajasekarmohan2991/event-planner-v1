import nodemailer from 'nodemailer';

async function setupTestEmail() {
  try {
    // Create a test account with Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('\n✅ Test Email Account Created!\n');
    console.log('Add these to your .env file:\n');
    console.log(`EMAIL_SERVER_HOST=smtp.ethereal.email`);
    console.log(`EMAIL_SERVER_PORT=587`);
    console.log(`EMAIL_SERVER_USER=${testAccount.user}`);
    console.log(`EMAIL_SERVER_PASSWORD=${testAccount.pass}`);
    console.log(`EMAIL_FROM=Event Planner <${testAccount.user}>`);
    console.log(`EMAIL_SERVER_SECURE=false\n`);
    console.log('📧 Preview emails at: https://ethereal.email/messages\n');
    console.log('🔗 Login URL:', testAccount.web);
    
    return testAccount;
  } catch (error) {
    console.error('Error creating test account:', error);
  }
}

setupTestEmail();
