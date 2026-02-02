import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testFloorPlanSave() {
    console.log('🔧 TESTING FLOOR PLAN SAVE FOR EVENT 20\n')
    console.log('='.repeat(60))

    try {
        // Step 1: Check Event 20
        console.log('\n📡 Step 1: Checking Event 20...')
        const event = await prisma.event.findUnique({
            where: { id: BigInt(20) },
            select: { id: true, name: true, tenantId: true, status: true }
        })

        if (!event) {
            console.log('❌ Event 20 NOT FOUND!')
            console.log('   This is why floor plan returns 404')
            return
        }

        console.log('✅ Event 20 exists:')
        console.log('   ID:', event.id.toString())
        console.log('   Name:', event.name)
        console.log('   Tenant ID:', event.tenantId)
        console.log('   Status:', event.status)

        if (!event.tenantId) {
            console.log('\n⚠️  WARNING: Event has no tenantId!')
            console.log('   Floor plan creation requires a tenantId')
            return
        }

        // Step 2: Check existing floor plans
        console.log('\n📡 Step 2: Checking existing floor plans...')
        const existingPlans = await prisma.floorPlan.findMany({
            where: { eventId: BigInt(20) },
            select: { id: true, name: true, createdAt: true }
        })

        console.log(`   Found ${existingPlans.length} floor plan(s)`)
        existingPlans.forEach((plan, i) => {
            console.log(`   ${i + 1}. ${plan.name} (ID: ${plan.id})`)
        })

        // Step 3: Try to create a test floor plan
        console.log('\n📡 Step 3: Testing floor plan creation...')

        try {
            const testPlan = await prisma.floorPlan.create({
                data: {
                    eventId: BigInt(20),
                    tenantId: event.tenantId!,
                    name: 'Test Floor Plan',
                    description: 'Test plan created by diagnostic script',
                    canvasWidth: 1200,
                    canvasHeight: 800,
                    backgroundColor: '#f8fafc',
                    gridSize: 20,
                    vipPrice: 5000,
                    premiumPrice: 2000,
                    generalPrice: 500,
                    objects: [],
                    layoutData: {}
                }
            })

            console.log('✅ Test floor plan created successfully!')
            console.log('   ID:', testPlan.id)
            console.log('   Name:', testPlan.name)

            // Clean up - delete the test plan
            await prisma.floorPlan.delete({
                where: { id: testPlan.id }
            })
            console.log('✅ Test plan deleted (cleanup)')

        } catch (createError: any) {
            console.error('❌ Failed to create floor plan:', createError.message)
            if (createError.code) {
                console.log('   Error code:', createError.code)
            }
        }

        // Step 4: Summary
        console.log('\n' + '='.repeat(60))
        console.log('📊 DIAGNOSIS COMPLETE\n')

        console.log('✅ Event 20 is ready for floor plans')
        console.log('✅ Floor plan API should work')
        console.log('\n📍 If you still get 404:')
        console.log('   1. Check browser console for the exact error')
        console.log('   2. Check Network tab for the API request/response')
        console.log('   3. Make sure you\'re logged in')
        console.log('   4. Try hard refresh (Cmd+Shift+R)')

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message)
        console.log('   Full error:', error)
    } finally {
        await prisma.$disconnect()
        console.log('\n🔌 Disconnected from database')
    }
}

testFloorPlanSave()
