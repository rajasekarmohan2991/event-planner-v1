const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function test() {
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: 'eventmanager@test.com' }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('Email:', user?.email);
    console.log('Has password field:', user?.password ? 'Yes' : 'No');
    console.log('Password hash (first 30 chars):', user?.password?.substring(0, 30));
    
    if (user && user.password) {
      // Test password
      const testPassword = 'password123';
      console.log('\nTesting password:', testPassword);
      
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('Password matches:', isValid ? '✅ YES' : '❌ NO');
      
      if (!isValid) {
        console.log('\n❌ PASSWORD DOES NOT MATCH!');
        console.log('Generating new hash for "password123"...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New hash:', newHash);
        console.log('\nTo fix, run:');
        console.log(`UPDATE users SET password_hash = '${newHash}' WHERE email = 'eventmanager@test.com';`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
