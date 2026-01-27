
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const events = await prisma.event.findMany({
        take: 5,
        select: { id: true, name: true }
    })
    console.log(JSON.stringify(events, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
        , 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
