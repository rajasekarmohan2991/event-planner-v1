const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking for existing user...');
    
    const existing = await prisma.user.findUnique({
      where: { email: 'fiserv@gmail.com' }
    });
    
    if (existing) {
      console.log('✅ User already exists:', existing.email);
      return;
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('fiserv@123', 10);
    
    console.log('👤 Creating user...');
    const user = await prisma.user.create({
      data: {
        email: 'fiserv@gmail.com',
        name: 'Fiserv Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
      }
    });
    
    console.log('✅ User created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Role:', user.role);
    console.log('🆔 ID:', user.id.toString());
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
