const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const res = await prisma.$queryRaw`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('EventRoleAssignment', 'event_role_assignments')
    `
        console.log('Database Columns:', JSON.stringify(res, null, 2))

        // Check if table exists with quotes
        try {
            const count = await prisma.$queryRaw`SELECT count(*) FROM "EventRoleAssignment"`
            console.log('Total Assignments (Quoted):', JSON.stringify(count, (k, v) => typeof v === 'bigint' ? v.toString() : v))
        } catch (e) {
            console.log('Quoted table not found')
        }

        // Check if table exists without quotes
        try {
            const count = await prisma.$queryRaw`SELECT count(*) FROM EventRoleAssignment`
            console.log('Total Assignments (Unquoted):', JSON.stringify(count, (k, v) => typeof v === 'bigint' ? v.toString() : v))
        } catch (e) {
            console.log('Unquoted table not found')
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
