import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const res = await prisma.$queryRaw`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('EventRoleAssignment', 'event_role_assignments')
    `
        console.log('Database Columns:', JSON.stringify(res, null, 2))

        const count = await prisma.$queryRaw`SELECT count(*) FROM "EventRoleAssignment"`
        console.log('Total Assignments:', count)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
