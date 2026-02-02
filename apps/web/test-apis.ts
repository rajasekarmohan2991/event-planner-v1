/**
 * API Test Script
 * Run this with: npx tsx test-apis.ts
 * 
 * This tests all the fixed APIs to verify they work correctly
 */

const BASE_URL = process.env.TEST_URL || 'https://aypheneventplanner.vercel.app'
const EVENT_ID = process.env.TEST_EVENT_ID || '26'

interface TestResult {
    name: string
    status: 'PASS' | 'FAIL' | 'SKIP'
    message: string
    details?: any
}

const results: TestResult[] = []

async function testAPI(name: string, url: string, expectedStatus: number = 200) {
    try {
        console.log(`\n🧪 Testing: ${name}`)
        console.log(`   URL: ${url}`)

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        })

        const data = await response.json().catch(() => null)

        if (response.status === expectedStatus) {
            console.log(`   ✅ PASS - Status: ${response.status}`)
            results.push({
                name,
                status: 'PASS',
                message: `Returned ${response.status} as expected`,
                details: data
            })
            return data
        } else {
            console.log(`   ❌ FAIL - Expected ${expectedStatus}, got ${response.status}`)
            console.log(`   Response:`, data)
            results.push({
                name,
                status: 'FAIL',
                message: `Expected ${expectedStatus}, got ${response.status}`,
                details: data
            })
            return null
        }
    } catch (error: any) {
        console.log(`   ❌ FAIL - Error: ${error.message}`)
        results.push({
            name,
            status: 'FAIL',
            message: error.message
        })
        return null
    }
}

async function runTests() {
    console.log('🚀 Starting API Tests...')
    console.log(`📍 Base URL: ${BASE_URL}`)
    console.log(`🎯 Event ID: ${EVENT_ID}`)
    console.log('='.repeat(60))

    // Test 1: Registrations List
    const registrations = await testAPI(
        'Registrations List',
        `${BASE_URL}/api/events/${EVENT_ID}/registrations-emergency`
    )

    if (registrations) {
        console.log(`   📊 Found ${registrations.registrations?.length || 0} registrations`)
    }

    // Test 2: Floor Plans List
    const floorPlans = await testAPI(
        'Floor Plans List',
        `${BASE_URL}/api/events/${EVENT_ID}/floor-plans-direct`
    )

    if (floorPlans) {
        console.log(`   📊 Found ${floorPlans.floorPlans?.length || 0} floor plans`)
    }

    // Test 3: Sessions List
    const sessions = await testAPI(
        'Sessions List',
        `${BASE_URL}/api/events/${EVENT_ID}/sessions`
    )

    if (sessions) {
        console.log(`   📊 Found ${sessions.sessions?.length || 0} sessions`)
    }

    // Test 4: Event Details
    await testAPI(
        'Event Details',
        `${BASE_URL}/api/events/${EVENT_ID}`
    )

    // Test 5: Speakers List
    await testAPI(
        'Speakers List',
        `${BASE_URL}/api/events/${EVENT_ID}/speakers?page=0&size=10`
    )

    // Print Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 TEST SUMMARY')
    console.log('='.repeat(60))

    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    const skipped = results.filter(r => r.status === 'SKIP').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📊 Total: ${results.length}`)

    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:')
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   - ${r.name}: ${r.message}`)
        })
    }

    console.log('\n' + '='.repeat(60))

    // Exit with error code if any tests failed
    process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(console.error)
