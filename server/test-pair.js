const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testPair() {
  console.log('Testing pair endpoints...\n');

  let authToken = null;

  // 1. Сначала регистрируемся
  try {
    console.log('1. Testing registration...');
    const registerData = {
      email: 'testpair@example.com',
      password: 'password123',
      first_name: 'Test Pair User',
      gender: 'other',
      age: 25,
      city: 'Test City'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    authToken = registerResponse.data.token;
    console.log('✅ Registration successful, token received');
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
    return;
  }

  // 2. Тестируем получение статуса пары
  try {
    console.log('\n2. Testing pair status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/pair/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Pair status successful:', statusResponse.data);
  } catch (error) {
    console.log('❌ Pair status failed:', error.response?.data || error.message);
  }

  // 3. Тестируем отправку запроса на пару
  try {
    console.log('\n3. Testing pair request...');
    const requestData = {
      partnerEmail: 'partner@example.com'
    };
    const requestResponse = await axios.post(`${API_BASE_URL}/pair/request`, requestData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Pair request successful:', requestResponse.data);
  } catch (error) {
    console.log('❌ Pair request failed:', error.response?.data || error.message);
  }
}

testPair().catch(console.error); 