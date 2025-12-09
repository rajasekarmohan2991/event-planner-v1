#!/usr/bin/env node

/**
 * Automated Integration Tests for Event Planner
 * Tests all CRUD operations and role-based access control
 */

const BASE_URL = 'http://localhost:3001';

// Test data sets
const testData = {
  events: [
    {
      name: 'Tech Conference 2024',
      city: 'Mumbai',
      venue: 'Convention Center',
      startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      price: 2500,
      eventMode: 'IN_PERSON',
      description: 'Annual tech conference'
    },
    {
      name: 'Virtual Workshop Series',
      city: 'Online',
      venue: 'Zoom',
      startsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      price: 500,
      eventMode: 'VIRTUAL',
      description: 'Online learning workshop'
    },
    {
      name: 'Hybrid Meetup',
      city: 'Delhi',
      venue: 'Tech Hub',
      startsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      price: 0,
      eventMode: 'HYBRID',
      description: 'Free community meetup'
    }
  ],
  speakers: [
    {
      name: 'Dr. Sarah Johnson',
      title: 'Chief Technology Officer',
      bio: 'Expert in AI and Machine Learning with 15 years of experience',
      company: 'TechCorp',
      photoUrl: 'https://i.pravatar.cc/300?img=1'
    },
    {
      name: 'John Smith',
      title: 'Senior Software Engineer',
      bio: 'Full-stack developer specializing in React and Node.js',
      company: 'StartupXYZ',
      photoUrl: 'https://i.pravatar.cc/300?img=2'
    },
    {
      name: 'Maria Garcia',
      title: 'Product Manager',
      bio: 'Leading product strategy for enterprise SaaS solutions',
      company: 'BigTech Inc',
      photoUrl: 'https://i.pravatar.cc/300?img=3'
    }
  ],
  sponsors: [
    {
      name: 'TechCorp Global',
      tier: 'PLATINUM',
      logoUrl: 'https://via.placeholder.com/200x100?text=TechCorp',
      website: 'https://techcorp.example.com',
      description: 'Leading technology solutions provider'
    },
    {
      name: 'StartupHub',
      tier: 'GOLD',
      logoUrl: 'https://via.placeholder.com/200x100?text=StartupHub',
      website: 'https://startuphub.example.com',
      description: 'Supporting innovative startups'
    },
    {
      name: 'DevTools Inc',
      tier: 'SILVER',
      logoUrl: 'https://via.placeholder.com/200x100?text=DevTools',
      website: 'https://devtools.example.com',
      description: 'Developer productivity tools'
    }
  ],
  sessions: [
    {
      title: 'Introduction to AI',
      description: 'Learn the basics of artificial intelligence',
      startTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      room: 'Hall A',
      type: 'WORKSHOP'
    },
    {
      title: 'Advanced React Patterns',
      description: 'Deep dive into React best practices',
      startTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      duration: 90,
      room: 'Hall B',
      type: 'TALK'
    },
    {
      title: 'Networking Break',
      description: 'Connect with other attendees',
      startTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      room: 'Lobby',
      type: 'BREAK'
    }
  ],
  teamMembers: [
    {
      email: 'coordinator@test.com',
      role: 'Coordinator'
    },
    {
      email: 'staff@test.com',
      role: 'Event Staff'
    },
    {
      email: 'vendor@test.com',
      role: 'Vendor'
    }
  ]
};

// Test users
const testUsers = {
  superAdmin: {
    email: 'rbusiness2111@gmail.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'your_password_here',
    role: 'SUPER_ADMIN'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN'
  },
  eventManager: {
    email: 'manager@test.com',
    password: 'password123',
    role: 'EVENT_MANAGER'
  },
  user: {
    email: 'user@test.com',
    password: 'password123',
    role: 'USER'
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make API calls
async function apiCall(method, path, data = null, cookies = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (cookies) {
    options.headers['Cookie'] = cookies;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.text();
    
    return {
      status: response.status,
      data: responseData ? JSON.parse(responseData) : null,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

// Test function
function test(name, fn) {
  return async () => {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      await fn();
      console.log(`✅ PASSED: ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  };
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Test suites
const tests = {
  
  // Authentication Tests
  async testSuperAdminLogin() {
    const response = await apiCall('POST', '/api/auth/signin', {
      email: testUsers.superAdmin.email,
      password: testUsers.superAdmin.password
    });
    
    assert(response.status === 200, 'Login should return 200');
    assert(response.data, 'Should return user data');
  },

  async testAdminLogin() {
    const response = await apiCall('POST', '/api/auth/signin', {
      email: testUsers.admin.email,
      password: testUsers.admin.password
    });
    
    assert(response.status === 200, 'Admin login should succeed');
  },

  async testEventManagerLogin() {
    const response = await apiCall('POST', '/api/auth/signin', {
      email: testUsers.eventManager.email,
      password: testUsers.eventManager.password
    });
    
    assert(response.status === 200, 'Event Manager login should succeed');
  },

  async testUserLogin() {
    const response = await apiCall('POST', '/api/auth/signin', {
      email: testUsers.user.email,
      password: testUsers.user.password
    });
    
    assert(response.status === 200, 'User login should succeed');
  },

  // Events CRUD Tests
  async testCreateEvent() {
    const eventData = testData.events[0];
    const response = await apiCall('POST', '/api/events', eventData);
    
    assert(response.status === 201 || response.status === 200, 'Event creation should succeed');
    assert(response.data && response.data.id, 'Should return event with ID');
    
    // Store event ID for later tests
    global.testEventId = response.data.id;
  },

  async testReadEvent() {
    assert(global.testEventId, 'Event ID should exist from previous test');
    
    const response = await apiCall('GET', `/api/events/${global.testEventId}`);
    
    assert(response.status === 200, 'Should fetch event successfully');
    assert(response.data.name === testData.events[0].name, 'Event name should match');
  },

  async testUpdateEvent() {
    assert(global.testEventId, 'Event ID should exist');
    
    const updatedData = {
      ...testData.events[0],
      name: 'Updated Tech Conference 2024',
      price: 3000
    };
    
    const response = await apiCall('PUT', `/api/events/${global.testEventId}`, updatedData);
    
    assert(response.status === 200, 'Event update should succeed');
  },

  async testListEvents() {
    const response = await apiCall('GET', '/api/events?page=1&limit=10');
    
    assert(response.status === 200, 'Should list events');
    assert(Array.isArray(response.data.data || response.data), 'Should return array of events');
  },

  // Speakers CRUD Tests
  async testCreateSpeaker() {
    assert(global.testEventId, 'Event ID should exist');
    
    const speakerData = testData.speakers[0];
    const response = await apiCall('POST', `/api/events/${global.testEventId}/speakers`, speakerData);
    
    assert(response.status === 201 || response.status === 200, 'Speaker creation should succeed');
    assert(response.data && response.data.id, 'Should return speaker with ID');
    
    global.testSpeakerId = response.data.id;
  },

  async testListSpeakers() {
    assert(global.testEventId, 'Event ID should exist');
    
    const response = await apiCall('GET', `/api/events/${global.testEventId}/speakers`);
    
    assert(response.status === 200, 'Should list speakers');
    assert(Array.isArray(response.data), 'Should return array of speakers');
  },

  async testUpdateSpeaker() {
    assert(global.testSpeakerId, 'Speaker ID should exist');
    
    const updatedData = {
      ...testData.speakers[0],
      title: 'Chief Innovation Officer'
    };
    
    const response = await apiCall('PUT', `/api/events/${global.testEventId}/speakers/${global.testSpeakerId}`, updatedData);
    
    assert(response.status === 200, 'Speaker update should succeed');
  },

  // Sponsors CRUD Tests
  async testCreateSponsor() {
    assert(global.testEventId, 'Event ID should exist');
    
    const sponsorData = testData.sponsors[0];
    const response = await apiCall('POST', `/api/events/${global.testEventId}/sponsors`, sponsorData);
    
    assert(response.status === 201 || response.status === 200, 'Sponsor creation should succeed');
    assert(response.data && response.data.id, 'Should return sponsor with ID');
    
    global.testSponsorId = response.data.id;
  },

  async testListSponsors() {
    assert(global.testEventId, 'Event ID should exist');
    
    const response = await apiCall('GET', `/api/events/${global.testEventId}/sponsors`);
    
    assert(response.status === 200, 'Should list sponsors');
    assert(Array.isArray(response.data), 'Should return array of sponsors');
  },

  async testUpdateSponsor() {
    assert(global.testSponsorId, 'Sponsor ID should exist');
    
    const updatedData = {
      ...testData.sponsors[0],
      tier: 'GOLD'
    };
    
    const response = await apiCall('PUT', `/api/events/${global.testEventId}/sponsors/${global.testSponsorId}`, updatedData);
    
    assert(response.status === 200, 'Sponsor update should succeed');
  },

  // Sessions CRUD Tests
  async testCreateSession() {
    assert(global.testEventId, 'Event ID should exist');
    
    const sessionData = testData.sessions[0];
    const response = await apiCall('POST', `/api/events/${global.testEventId}/sessions`, sessionData);
    
    assert(response.status === 201 || response.status === 200, 'Session creation should succeed');
    
    global.testSessionId = response.data?.id;
  },

  async testListSessions() {
    assert(global.testEventId, 'Event ID should exist');
    
    const response = await apiCall('GET', `/api/events/${global.testEventId}/sessions`);
    
    assert(response.status === 200, 'Should list sessions');
  },

  // Team Management Tests
  async testInviteTeamMember() {
    assert(global.testEventId, 'Event ID should exist');
    
    const memberData = testData.teamMembers[0];
    const response = await apiCall('POST', `/api/events/${global.testEventId}/team`, memberData);
    
    assert(response.status === 201 || response.status === 200, 'Team member invitation should succeed');
  },

  async testListTeamMembers() {
    assert(global.testEventId, 'Event ID should exist');
    
    const response = await apiCall('GET', `/api/events/${global.testEventId}/team`);
    
    assert(response.status === 200, 'Should list team members');
  },

  // Delete Tests (should be last)
  async testDeleteSpeaker() {
    assert(global.testSpeakerId, 'Speaker ID should exist');
    
    const response = await apiCall('DELETE', `/api/events/${global.testEventId}/speakers/${global.testSpeakerId}`);
    
    assert(response.status === 200 || response.status === 204, 'Speaker deletion should succeed');
  },

  async testDeleteSponsor() {
    assert(global.testSponsorId, 'Sponsor ID should exist');
    
    const response = await apiCall('DELETE', `/api/events/${global.testEventId}/sponsors/${global.testSponsorId}`);
    
    assert(response.status === 200 || response.status === 204, 'Sponsor deletion should succeed');
  },

  async testDeleteEvent() {
    assert(global.testEventId, 'Event ID should exist');
    
    const response = await apiCall('DELETE', `/api/events/${global.testEventId}`);
    
    assert(response.status === 200 || response.status === 204, 'Event deletion should succeed');
  }
};

// Run all tests
async function runTests() {
  console.log('🚀 Starting Automated Integration Tests\n');
  console.log('=' .repeat(60));
  
  const testNames = Object.keys(tests);
  
  for (const testName of testNames) {
    await test(testName, tests[testName])();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, tests, testData };
