const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testAuth() {
  console.log('Testing authentication endpoints...\n');

  // Test registration
  try {
    console.log('1. Testing registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test User',
      gender: 'other',
      age: 25,
      city: 'Test City'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data);
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
  }

  // Test login
  try {
    console.log('\n2. Testing login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful:', {
      token: loginResponse.data.token ? 'Present' : 'Missing',
      user: loginResponse.data.user ? 'Present' : 'Missing'
    });
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }

  // Test invalid login
  try {
    console.log('\n3. Testing invalid login...');
    const invalidLoginData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const invalidLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, invalidLoginData);
    console.log('❌ Invalid login should have failed but succeeded');
  } catch (error) {
    console.log('✅ Invalid login correctly failed:', error.response?.data?.message || error.message);
  }
}

testAuth().catch(console.error); 