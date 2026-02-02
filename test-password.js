const bcrypt = require('bcryptjs');

const password = 'password123';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

bcrypt.compare(password, hash).then(result => {
  console.log('Password matches:', result);
  if (!result) {
    console.log('❌ Password does NOT match the hash!');
    console.log('Generating new hash for "password123"...');
    bcrypt.hash(password, 10).then(newHash => {
      console.log('New hash:', newHash);
    });
  } else {
    console.log('✅ Password matches the hash correctly!');
  }
}).catch(err => {
  console.error('Error:', err);
});
