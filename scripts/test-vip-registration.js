/**
 * VIP Seat Registration Test Script
 * 
 * This script tests the VIP registration flow by:
 * 1. Finding available VIP seats
 * 2. Attempting to reserve them
 * 3. Going through the confirmation process
 * 
 * Run this script with Node.js:
 * node test-vip-registration.js
 */

const axios = require('axios');
const API_URL = 'http://localhost:3001';
const EVENT_ID = 1; // Change this to your test event ID

// Test user credentials (you may need to update these)
const USER_CREDENTIALS = {
  email: 'user@eventplanner.com',
  password: 'password123'
};

// Test parameters
const TEST_VIP_SEATS = true;
const TEST_PREMIUM_SEATS = true;
const TEST_STANDARD_SEATS = true;

async function testVipRegistration() {
  try {
    console.log('🧪 Starting VIP Registration Flow Test');
    
    // 1. Login to get session cookie
    console.log('\n🔑 Logging in...');
    const loginRes = await axios.post(`${API_URL}/api/auth/callback/credentials`, USER_CREDENTIALS, {
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    });
    
    // Get cookies from login response
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) {
      throw new Error('Login failed, no cookies returned');
    }
    
    const axiosConfig = {
      headers: {
        Cookie: cookies.join('; ')
      },
      withCredentials: true
    };
    
    console.log('✅ Login successful');
    
    // 2. Check seat availability
    console.log('\n🔍 Checking seat availability...');
    const availabilityRes = await axios.get(
      `${API_URL}/api/events/${EVENT_ID}/seats/availability`, 
      axiosConfig
    );
    
    const seats = availabilityRes.data.seats || [];
    console.log(`Found ${seats.length} total seats`);
    
    // Group seats by type
    const vipSeats = seats.filter(s => s.seatType === 'VIP' && s.available);
    const premiumSeats = seats.filter(s => s.seatType === 'PREMIUM' && s.available);
    const standardSeats = seats.filter(s => s.seatType === 'STANDARD' && s.available);
    
    console.log(`- VIP seats: ${vipSeats.length}`);
    console.log(`- Premium seats: ${premiumSeats.length}`);
    console.log(`- Standard seats: ${standardSeats.length}`);
    
    if (TEST_VIP_SEATS && vipSeats.length === 0) {
      console.log('⚠️ No VIP seats available for testing');
    }
    
    if (TEST_PREMIUM_SEATS && premiumSeats.length === 0) {
      console.log('⚠️ No Premium seats available for testing');
    }
    
    if (TEST_STANDARD_SEATS && standardSeats.length === 0) {
      console.log('⚠️ No Standard seats available for testing');
    }
    
    // Select seats to test
    const testSeats = [];
    if (TEST_VIP_SEATS && vipSeats.length > 0) testSeats.push(vipSeats[0]);
    if (TEST_PREMIUM_SEATS && premiumSeats.length > 0) testSeats.push(premiumSeats[0]);
    if (TEST_STANDARD_SEATS && standardSeats.length > 0) testSeats.push(standardSeats[0]);
    
    if (testSeats.length === 0) {
      throw new Error('No available seats to test');
    }
    
    console.log(`\n🎟️ Testing with ${testSeats.length} seats:`);
    testSeats.forEach(seat => {
      console.log(`- ${seat.seatType} seat: Section ${seat.section}, Row ${seat.rowNumber}, Seat ${seat.seatNumber} (₹${seat.basePrice})`);
    });
    
    // 3. Reserve the test seats
    console.log('\n🔒 Reserving seats...');
    const reserveRes = await axios.post(
      `${API_URL}/api/events/${EVENT_ID}/seats/reserve`,
      { seatIds: testSeats.map(s => s.id) },
      axiosConfig
    );
    
    console.log('✅ Seats reserved successfully');
    console.log(`Reservation expires at: ${reserveRes.data.expiresAt}`);
    console.log(`Total Price: ₹${reserveRes.data.totalPrice}`);
    
    // 4. Create registration
    console.log('\n📋 Creating registration...');
    const registrationData = {
      firstName: 'Test',
      lastName: 'User',
      email: USER_CREDENTIALS.email,
      phone: '9876543210',
      numberOfAttendees: 1,
      seats: testSeats.map(s => ({
        id: s.id,
        section: s.section,
        row: s.rowNumber,
        seat: s.seatNumber,
        price: s.basePrice
      })),
      priceInr: reserveRes.data.totalPrice,
      paymentMethod: 'dummy',
      paymentStatus: 'PAID',
      type: 'SEATED'
    };
    
    const regRes = await axios.post(
      `${API_URL}/api/events/${EVENT_ID}/registrations`,
      registrationData,
      axiosConfig
    );
    
    console.log('✅ Registration created successfully');
    console.log(`Registration ID: ${regRes.data.id}`);
    
    // 5. Confirm seats
    console.log('\n✅ Confirming seats...');
    const confirmRes = await axios.post(
      `${API_URL}/api/events/${EVENT_ID}/seats/confirm`,
      { 
        seatIds: testSeats.map(s => s.id),
        registrationId: regRes.data.id,
        paymentStatus: 'PAID'
      },
      axiosConfig
    );
    
    console.log('🎉 Seats confirmed successfully!');
    console.log(`${confirmRes.data.confirmedSeats.length} seat(s) confirmed`);
    
    // 6. Clean up (optional) - uncomment to delete the test registration
    /*
    console.log('\n🧹 Cleaning up test data...');
    await axios.delete(
      `${API_URL}/api/admin/registrations/${regRes.data.id}`,
      axiosConfig
    );
    console.log('✅ Test data cleaned up');
    */
    
    console.log('\n✨ VIP Registration Flow Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
  }
}

testVipRegistration();
