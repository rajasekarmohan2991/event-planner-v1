import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testRegistration() {
    console.log('🧪 Testing registration creation...\n')

    const testData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        gender: 'Male'
    }

    try {
        const registration = await prisma.registration.create({
            data: {
                eventId: BigInt(22),
                email: testData.email,
                status: 'APPROVED',
                type: 'GENERAL',
                dataJson: testData,
                approvalMode: 'AUTOMATIC'
            }
        })

        console.log('✅ Registration created successfully!')
        console.log('ID:', registration.id)
        console.log('Email:', registration.email)
        console.log('Status:', registration.status)

        // Now check if we can find it
        const found = await prisma.registration.findMany({
            where: { eventId: BigInt(22) }
        })

        console.log('\n📊 Total registrations for Event 22:', found.length)

        // Clean up
        await prisma.registration.delete({
            where: { id: registration.id }
        })
        console.log('\n🧹 Test registration deleted')

    } catch (error: any) {
        console.error('❌ Error:', error.message)
        console.error('Code:', error.code)
    }

    await prisma.$disconnect()
}

testRegistration()
