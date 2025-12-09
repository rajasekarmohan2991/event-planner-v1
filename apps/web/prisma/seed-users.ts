
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Password123!', 12)

  const users = [
    {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      password,
    },
    {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password,
    },
    {
      email: 'manager@example.com',
      name: 'Event Manager',
      role: 'EVENT_MANAGER',
      password,
    },
    {
      email: 'user@example.com',
      name: 'Regular User',
      role: 'USER',
      password,
    },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: u.password,
        role: u.role,
      },
      create: {
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role,
      },
    })
    console.log(`Seeded user: ${u.email}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
