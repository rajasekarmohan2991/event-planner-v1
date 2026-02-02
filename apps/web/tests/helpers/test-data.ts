/**
 * Test data generators for E2E tests
 */

// Generate unique identifier based on timestamp
export function uniqueId(): string {
  return Date.now().toString(36)
}

// Generate test event data
export function generateEventData() {
  const id = uniqueId()
  return {
    title: `Test Event ${id}`,
    description: `Automated test event created at ${new Date().toISOString()}`,
    type: 'Conference',
    category: 'Technology',
    capacity: '100',
    venue: 'Test Convention Center',
    city: 'Chennai'
  }
}

// Generate test session data
export function generateSessionData() {
  const id = uniqueId()
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later
  
  return {
    title: `Test Session ${id}`,
    description: `Automated test session`,
    startTime: startTime.toISOString().slice(0, 16),
    endTime: endTime.toISOString().slice(0, 16),
    room: 'Room A',
    capacity: '50'
  }
}

// Generate test speaker data
export function generateSpeakerData() {
  const id = uniqueId()
  return {
    name: `Test Speaker ${id}`,
    title: 'Senior Developer',
    bio: 'Expert in software development',
    email: `speaker${id}@test.com`,
    company: 'Test Company'
  }
}

// Generate test sponsor data
export function generateSponsorData() {
  const id = uniqueId()
  return {
    name: `Test Sponsor ${id}`,
    tier: 'Gold',
    contactName: 'John Doe',
    contactEmail: `sponsor${id}@test.com`,
    amount: '10000'
  }
}

// Generate test vendor data
export function generateVendorData() {
  const id = uniqueId()
  return {
    name: `Test Vendor ${id}`,
    category: 'Catering',
    contactName: 'Jane Doe',
    contactEmail: `vendor${id}@test.com`,
    budget: '5000'
  }
}

// Generate test registration data
export function generateRegistrationData() {
  const id = uniqueId()
  return {
    firstName: 'Test',
    lastName: `User${id}`,
    email: `testuser${id}@test.com`,
    phone: '+919876543210'
  }
}

// Generate test team member data
export function generateTeamMemberData() {
  const id = uniqueId()
  return {
    email: `teammember${id}@test.com`,
    role: 'Event Staff'
  }
}
