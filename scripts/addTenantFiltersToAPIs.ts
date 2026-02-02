/**
 * Script to add tenant_id filters to all API queries
 * 
 * This script identifies APIs that need tenant filtering and provides
 * a report of what needs to be updated
 */

import * as fs from 'fs'
import * as path from 'path'

const API_DIR = path.join(__dirname, '../apps/web/app/api')

interface APIFile {
  path: string
  hasPrismaQuery: boolean
  hasRawQuery: boolean
  hasTenantFilter: boolean
  needsUpdate: boolean
}

function scanFile(filePath: string): APIFile | null {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Check if file has Prisma queries
  const hasPrismaQuery = /prisma\.\$queryRaw|prisma\.\$executeRaw|prisma\.\w+\.findMany|prisma\.\w+\.findUnique|prisma\.\w+\.create|prisma\.\w+\.update/.test(content)
  const hasRawQuery = /\$queryRaw|FROM\s+\w+/.test(content)
  const hasTenantFilter = /tenant_id|tenantFilter|getTenantId/.test(content)
  
  if (!hasPrismaQuery && !hasRawQuery) {
    return null
  }
  
  return {
    path: filePath.replace(API_DIR, ''),
    hasPrismaQuery,
    hasRawQuery,
    hasTenantFilter,
    needsUpdate: (hasPrismaQuery || hasRawQuery) && !hasTenantFilter
  }
}

function scanDirectory(dir: string): APIFile[] {
  const results: APIFile[] = []
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      results.push(...scanDirectory(fullPath))
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      const result = scanFile(fullPath)
      if (result) {
        results.push(result)
      }
    }
  }
  
  return results
}

function main() {
  console.log('🔍 Scanning API routes for tenant filtering...\n')
  
  const apiFiles = scanDirectory(API_DIR)
  
  const needsUpdate = apiFiles.filter(f => f.needsUpdate)
  const hasFilter = apiFiles.filter(f => f.hasTenantFilter)
  
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total API files with queries: ${apiFiles.length}`)
  console.log(`✅ Already has tenant filter: ${hasFilter.length}`)
  console.log(`❌ Needs tenant filter: ${needsUpdate.length}`)
  console.log('')
  
  if (needsUpdate.length > 0) {
    console.log('❌ FILES NEEDING TENANT FILTERS:')
    console.log('='.repeat(60))
    needsUpdate.forEach(f => {
      console.log(`  ${f.path}`)
      console.log(`    - Has Prisma query: ${f.hasPrismaQuery}`)
      console.log(`    - Has raw SQL: ${f.hasRawQuery}`)
      console.log('')
    })
  }
  
  if (hasFilter.length > 0) {
    console.log('✅ FILES WITH TENANT FILTERS:')
    console.log('='.repeat(60))
    hasFilter.forEach(f => {
      console.log(`  ${f.path}`)
    })
  }
  
  console.log('\n💡 NEXT STEPS:')
  console.log('1. Import: import { getTenantId } from "@/lib/tenant-context"')
  console.log('2. Get tenant: const tenantId = getTenantId()')
  console.log('3. Add filter: WHERE ... AND tenant_id = ${tenantId}')
  console.log('4. Or use helper: where: tenantWhere({ ... })')
}

main()
