const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('🔧 Fixing password hashes...\n');
    
    // Generate hashes
    const password123Hash = await bcrypt.hash('password123', 10);
    const admin123Hash = await bcrypt.hash('admin123', 10);
    
    console.log('Generated hashes:');
    console.log('password123:', password123Hash);
    console.log('admin123:', admin123Hash);
    console.log('');
    
    // Update all users with password123
    const users = [
      'rbusiness2111@gmail.com',
      'tenantadmin@test.com',
      'eventmanager@test.com',
      'marketing@test.com',
      'finance@test.com',
      'support@test.com',
      'content@test.com',
      'analyst@test.com',
      'viewer@test.com'
    ];
    
    for (const email of users) {
      const result = await prisma.user.update({
        where: { email },
        data: { password: password123Hash }
      });
      console.log(`✅ Updated ${email}`);
    }
    
    // Update admin
    await prisma.user.update({
      where: { email: 'admin@eventplanner.com' },
      data: { password: admin123Hash }
    });
    console.log(`✅ Updated admin@eventplanner.com`);
    
    console.log('\n🎉 All passwords fixed!');
    console.log('\nYou can now login with:');
    console.log('- Most users: password123');
    console.log('- Admin: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
