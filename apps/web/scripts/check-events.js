#!/usr/bin/env node

/**
 * Diagnostic script to check events in the database
 * Run with: node scripts/check-events.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking Events Database...\n')

    try {
        // 1. Count total events
        const totalEvents = await prisma.event.count()
        console.log(`📊 Total Events in Database: ${totalEvents}`)

        if (totalEvents === 0) {
            console.log('\n⚠️  No events found in database!')
            console.log('💡 Suggestion: Create a test event to verify the system is working\n')
            return
        }

        // 2. Get all events with basic info
        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                tenantId: true,
                startsAt: true,
                endsAt: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        })

        console.log(`\n📋 Recent Events (showing up to 10):\n`)
        events.forEach((event, index) => {
            console.log(`${index + 1}. ${event.name}`)
            console.log(`   ID: ${event.id}`)
            console.log(`   Status: ${event.status}`)
            console.log(`   Tenant: ${event.tenantId || 'NULL'}`)
            console.log(`   Starts: ${event.startsAt}`)
            console.log(`   Created: ${event.createdAt}`)
            console.log('')
        })

        // 3. Group by status
        const statusGroups = await prisma.event.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        })

        console.log('📊 Events by Status:')
        statusGroups.forEach(group => {
            console.log(`   ${group.status}: ${group._count.status}`)
        })

        // 4. Group by tenant
        const tenantGroups = await prisma.event.groupBy({
            by: ['tenantId'],
            _count: {
                tenantId: true
            }
        })

        console.log('\n🏢 Events by Tenant:')
        for (const group of tenantGroups) {
            if (group.tenantId) {
                const tenant = await prisma.tenant.findUnique({
                    where: { id: group.tenantId },
                    select: { name: true, slug: true }
                })
                console.log(`   ${tenant?.name || 'Unknown'} (${tenant?.slug}): ${group._count.tenantId}`)
            } else {
                console.log(`   NULL (no tenant): ${group._count.tenantId}`)
            }
        }

        // 5. Check for SUPER_ADMIN user
        console.log('\n👤 Checking for SUPER_ADMIN users:')
        const superAdmins = await prisma.user.findMany({
            where: {
                role: 'SUPER_ADMIN'
            },
            select: {
                id: true,
                name: true,
                email: true,
                currentTenantId: true
            }
        })

        if (superAdmins.length === 0) {
            console.log('   ⚠️  No SUPER_ADMIN users found!')
        } else {
            superAdmins.forEach(admin => {
                console.log(`   ✅ ${admin.name} (${admin.email})`)
                console.log(`      Current Tenant: ${admin.currentTenantId || 'NULL'}`)
            })
        }

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
