/**
 * Verification Script: Check tenant_id backfill completion
 * 
 * Verifies that all tables have tenant_id populated
 * Reports any tables with NULL tenant_id values
 */

import prisma from '../apps/web/lib/prisma'

interface VerificationResult {
  tableName: string
  totalRows: number
  nullRows: number
  hasNulls: boolean
  success: boolean
  error?: string
}

async function verifyTable(tableName: string): Promise<VerificationResult> {
  try {
    // Count total rows
    const totalResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM "${tableName}"
    `)
    const totalRows = parseInt(totalResult[0]?.count || '0')
    
    // Count NULL tenant_id rows
    const nullResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count 
      FROM "${tableName}" 
      WHERE tenant_id IS NULL
    `)
    const nullRows = parseInt(nullResult[0]?.count || '0')
    
    return {
      tableName,
      totalRows,
      nullRows,
      hasNulls: nullRows > 0,
      success: true
    }
  } catch (error: any) {
    return {
      tableName,
      totalRows: 0,
      nullRows: 0,
      hasNulls: false,
      success: false,
      error: error.message
    }
  }
}

async function main() {
  console.log('🔍 Starting tenant_id verification...\n')
  
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
    'registration_approvals',
    'registration_custom_fields',
    'registration_settings',
    'event_registration_settings',
    'rsvp_interests',
    'rsvp_responses',
    'event_rsvps',
    'event_attendees',
    'event_invites',
    'event_planning',
    'event_team_members',
    'event_ticket_settings',
    'promo_codes',
    'payment_settings',
    'locations',
    'floor_plans',
    'floor_plan_configs',
    'FloorPlan',
    'seat_inventory',
    'seat_reservations',
    'session_speakers',
    'cancellation_requests',
    'microsite_sections',
    'microsite_themes',
    'notification_schedule',
    'team_notification_members',
    'user_notifications',
    'calendar_events',
    'activity_log',
    'module_access_matrix',
    'lookup_groups',
    'lookup_options'
  ]
  
  const results: VerificationResult[] = []
  
  // Verify each table
  for (const table of tables) {
    const result = await verifyTable(table)
    results.push(result)
  }
  
  // Summary
  console.log('='.repeat(80))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(80))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const tablesWithNulls = results.filter(r => r.hasNulls)
  const totalRows = results.reduce((sum, r) => sum + r.totalRows, 0)
  const totalNulls = results.reduce((sum, r) => sum + r.nullRows, 0)
  
  console.log(`\n✅ Tables verified: ${successful.length}/${results.length}`)
  console.log(`❌ Verification failed: ${failed.length}/${results.length}`)
  console.log(`📝 Total rows checked: ${totalRows.toLocaleString()}`)
  console.log(`⚠️  Rows with NULL tenant_id: ${totalNulls.toLocaleString()}`)
  
  if (tablesWithNulls.length > 0) {
    console.log(`\n⚠️  WARNING: ${tablesWithNulls.length} tables have NULL tenant_id values:`)
    tablesWithNulls.forEach(t => {
      console.log(`   ❌ ${t.tableName}: ${t.nullRows}/${t.totalRows} rows missing tenant_id`)
    })
    console.log('\n💡 Run backfill script again to fix these tables')
  } else {
    console.log('\n✅ SUCCESS: All tables have tenant_id populated!')
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to verify:')
    failed.forEach(f => {
      console.log(`   - ${f.tableName}: ${f.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('📋 Detailed Results:')
  console.log('='.repeat(80))
  console.log('Table Name'.padEnd(40) + 'Total Rows'.padStart(12) + 'NULL Rows'.padStart(12) + ' Status')
  console.log('-'.repeat(80))
  
  results.forEach(r => {
    if (!r.success) {
      console.log(`${r.tableName.padEnd(40)}${'ERROR'.padStart(12)}${'ERROR'.padStart(12)} ❌`)
    } else {
      const status = r.hasNulls ? '⚠️ ' : '✅'
      console.log(
        `${r.tableName.padEnd(40)}${r.totalRows.toString().padStart(12)}${r.nullRows.toString().padStart(12)} ${status}`
      )
    }
  })
  
  console.log('\n' + '='.repeat(80))
  
  // Exit with error code if there are issues
  if (tablesWithNulls.length > 0 || failed.length > 0) {
    console.log('\n❌ Verification FAILED - Issues found')
    process.exit(1)
  } else {
    console.log('\n✅ Verification PASSED - All tables ready for multi-tenant operation')
    process.exit(0)
  }
}

main()
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
