
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const eventId = 40
    console.log('Fetching plan for event', eventId)
    const configs = await prisma.$queryRaw<any[]>`
    SELECT layout_data FROM floor_plan_configs WHERE event_id = ${eventId} LIMIT 1
  `
    if (configs.length > 0) {
        console.log('Plan Found. Layout Data Summary:')
        const data = configs[0].layout_data
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        console.log('Type:', parsed.type)
        console.log('Sections:', parsed.sections ? parsed.sections.length : 'Missing')
        if (parsed.sections) {
            console.log('First Section Rows:', parsed.sections[0]?.rows?.length)
        }
    } else {
        console.log('No plan found')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
