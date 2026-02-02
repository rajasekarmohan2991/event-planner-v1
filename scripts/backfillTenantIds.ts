/**
 * Backfill Script: Populate tenant_id for all existing data
 * 
 * This script assigns 'default-tenant' to all rows where tenant_id is NULL
 * Ensures backward compatibility with existing data
 */

import prisma from '../apps/web/lib/prisma'

const DEFAULT_TENANT_ID = 'default-tenant'

interface TableUpdateResult {
  tableName: string
  rowsUpdated: number
  success: boolean
  error?: string
}

async function backfillTable(tableName: string, idColumn: string = 'id'): Promise<TableUpdateResult> {
  try {
    console.log(`\n📝 Processing table: ${tableName}`)
    
    // Count rows without tenant_id
    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count 
      FROM "${tableName}" 
      WHERE tenant_id IS NULL
    `)
    
    const nullCount = parseInt(countResult[0]?.count || '0')
    console.log(`   Found ${nullCount} rows without tenant_id`)
    
    if (nullCount === 0) {
      console.log(`   ✅ All rows already have tenant_id`)
      return { tableName, rowsUpdated: 0, success: true }
    }
    
    // Update rows
    const updateResult = await prisma.$executeRawUnsafe(`
      UPDATE "${tableName}"
      SET tenant_id = '${DEFAULT_TENANT_ID}'
      WHERE tenant_id IS NULL
    `)
    
    console.log(`   ✅ Updated ${updateResult} rows`)
    
    return {
      tableName,
      rowsUpdated: updateResult,
      success: true
    }
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return {
      tableName,
      rowsUpdated: 0,
      success: false,
      error: error.message
    }
  }
}

async function main() {
  console.log('🚀 Starting tenant_id backfill process...')
  console.log(`📌 Default tenant ID: ${DEFAULT_TENANT_ID}\n`)
  
  const results: TableUpdateResult[] = []
  
  // Core event-related tables
  const tables = [
    'events',
    'registrations',
    'tickets',
    'payments',
    'sessions',
    'speakers',
    'sponsors',
    'exhibitors',
    'exhibitor_registrations',
    
    // Registration tables
    'registration_approvals',
    'registration_custom_fields',
    'registration_settings',
    'event_registration_settings',
    
    // RSVP tables
    'rsvp_interests',
    'rsvp_responses',
    'event_rsvps',
    
    // Event management
    'event_attendees',
    'event_invites',
    'event_planning',
    'event_team_members',
    'event_ticket_settings',
    
    // Promo and payment
    'promo_codes',
    'payment_settings',
    
    // Venue and location
    'locations',
    'floor_plans',
    'floor_plan_configs',
    'FloorPlan',
    
    // Seating
    'seat_inventory',
    'seat_reservations',
    
    // Relations
    'session_speakers',
    
    // Cancellation
    'cancellation_requests',
    
    // Microsite
    'microsite_sections',
    'microsite_themes',
    
    // Notifications
    'notification_schedule',
    'team_notification_members',
    'user_notifications',
    
    // Calendar
    'calendar_events',
    
    // Activity
    'activity_log',
    
    // Module access
    'module_access_matrix',
    
    // Lookup tables
    'lookup_groups',
    'lookup_options'
  ]
  
  // Process each table
  for (const table of tables) {
    const result = await backfillTable(table)
    results.push(result)
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 BACKFILL SUMMARY')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const totalUpdated = results.reduce((sum, r) => sum + r.rowsUpdated, 0)
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length} tables`)
  console.log(`❌ Failed: ${failed.length}/${results.length} tables`)
  console.log(`📝 Total rows updated: ${totalUpdated}`)
  
  if (failed.length > 0) {
    console.log('\n❌ Failed tables:')
    failed.forEach(f => {
      console.log(`   - ${f.tableName}: ${f.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Detailed results
  console.log('\n📋 Detailed Results:')
  results.forEach(r => {
    const status = r.success ? '✅' : '❌'
    console.log(`${status} ${r.tableName.padEnd(35)} ${r.rowsUpdated.toString().padStart(6)} rows`)
  })
  
  console.log('\n✨ Backfill process completed!')
  console.log('💡 Next step: Run verification script to confirm all data has tenant_id\n')
}

main()
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
