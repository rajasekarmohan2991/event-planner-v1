import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1) Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: { 
      slug: 'default', 
      name: 'Default Organization',
      subdomain: 'default' // Required field
    },
  })

  // 2) Attach all users to default tenant
  const users = await prisma.user.findMany({ select: { id: true } })
  for (const u of users) {
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: u.id } },
      update: {},
      create: { tenantId: tenant.id, userId: u.id, role: 'owner' },
    })
  }

  console.log('Seed complete. Default tenant id:', tenant.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
