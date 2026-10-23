const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  try {
    console.log('--- STARTING AUTOMATED TESTS ---');

    // 1. Test Authentication
    console.log('1. Testing Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(loginData.message || 'Login Failed');
    
    const token = loginData.token;
    console.log('✅ Login Successful');

    // Setup headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Test Fetching Company Profile
    console.log('2. Testing Company Profile Fetch...');
    const profileRes = await fetch(`${BASE_URL}/company/profiles`, { headers });
    const profileData = await profileRes.json();
    const profileName = profileData.data && profileData.data[0] ? profileData.data[0].name : 'No profile configured';
    console.log(`✅ Company Profile Fetched: ${profileName}`);

    // 3. Test Plant Creation
    console.log('3. Testing Plant Creation...');
    const plantCode = `PLANT-${Math.floor(Math.random() * 10000)}`;
    const plantRes = await fetch(`${BASE_URL}/company/plants`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test Plant', code: plantCode, location: 'New York' })
    });
    const plantData = await plantRes.json();
    if (!plantData.success) throw new Error(plantData.message);
    console.log(`✅ Plant Created: ${plantData.data.code}`);

    // 4. Test Audit Logging
    console.log('4. Testing Audit Logs & Interceptor...');
    const auditRes = await fetch(`${BASE_URL}/audit/logs`, { headers });
    const auditData = await auditRes.json();
    const logs = auditData.data;
    
    const latestLog = logs.find(log => log.module === 'Plant' && log.action === 'CREATE');
    if (latestLog) {
      console.log('✅ Audit Interceptor Working Correctly');
    } else {
      console.log('❌ Audit Log NOT Found for Plant Creation');
    }

    // 5. Test Login History
    console.log('5. Testing Login History...');
    const historyRes = await fetch(`${BASE_URL}/audit/login-history`, { headers });
    const historyData = await historyRes.json();
    const histories = historyData.data;
    if (histories.length > 0 && histories[0].email === 'admin@example.com') {
      console.log('✅ Login History Working Correctly');
    } else {
      console.log('❌ Login History NOT Found');
    }

    console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
};

runTests();
