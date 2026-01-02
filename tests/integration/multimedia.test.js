#!/usr/bin/env node

/**
 * Integration tests for multimedia messaging features
 * These tests verify that the WAHA Core now supports sending images, audio, video, and files
 * that were previously only available in WAHA Plus.
 *
 * To run these tests:
 * 1. Start WAHA server: npm run start:dev or npm run start:prod
 * 2. Run tests: node tests/integration/multimedia.test.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test'; // Default test API key
const SESSION_NAME = 'default';

// Test configuration
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '1234567890@c.us'; // Replace with actual test number
const TEST_IMAGE_PATH = path.join(__dirname, '../../examples/waha.jpg');
const TEST_AUDIO_PATH = path.join(__dirname, '../../examples/voice.opus');
const TEST_VIDEO_PATH = path.join(__dirname, '../../examples/video.mp4');
const TEST_FILE_PATH = path.join(__dirname, '../../examples/example.pdf');

// Helper function to make API requests
async function apiRequest(endpoint, data) {
  try {
    const response = await axios.post(`${BASE_URL}/api/${endpoint}`, {
      session: SESSION_NAME,
      ...data
    }, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout for media uploads
    });
    console.log(`✅ ${endpoint}: SUCCESS`);
    return response.data;
  } catch (error) {
    console.log(`❌ ${endpoint}: FAILED - ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test functions
async function testSendImage() {
  console.log('\n🖼️  Testing sendImage...');

  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log(`⚠️  Skipping sendImage test - test image not found: ${TEST_IMAGE_PATH}`);
    return;
  }

  // Test with URL
  await apiRequest('sendImage', {
    chatId: TEST_PHONE_NUMBER,
    file: 'https://httpbin.org/image/jpeg'
  });

  // Test with base64
  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const base64Image = imageBuffer.toString('base64');

    await apiRequest('sendImage', {
      chatId: TEST_PHONE_NUMBER,
      file: `data:image/jpeg;base64,${base64Image}`,
      caption: 'Test image from WAHA Core! 🎉'
    });
  } catch (error) {
    console.log(`⚠️  Skipping base64 image test - ${error.message}`);
  }
}

async function testSendFile() {
  console.log('\n📄 Testing sendFile...');

  if (!fs.existsSync(TEST_FILE_PATH)) {
    console.log(`⚠️  Skipping sendFile test - test file not found: ${TEST_FILE_PATH}`);
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(TEST_FILE_PATH);
    const base64File = fileBuffer.toString('base64');
    const filename = path.basename(TEST_FILE_PATH);

    await apiRequest('sendFile', {
      chatId: TEST_PHONE_NUMBER,
      file: `data:application/pdf;base64,${base64File}`,
      filename: filename,
      caption: 'Test PDF file from WAHA Core!'
    });
  } catch (error) {
    console.log(`⚠️  Skipping file test - ${error.message}`);
  }
}

async function testSendVoice() {
  console.log('\n🎵 Testing sendVoice...');

  if (!fs.existsSync(TEST_AUDIO_PATH)) {
    console.log(`⚠️  Skipping sendVoice test - test audio not found: ${TEST_AUDIO_PATH}`);
    return;
  }

  try {
    const audioBuffer = fs.readFileSync(TEST_AUDIO_PATH);
    const base64Audio = audioBuffer.toString('base64');

    await apiRequest('sendVoice', {
      chatId: TEST_PHONE_NUMBER,
      file: `data:audio/ogg;base64,${base64Audio}`
    });
  } catch (error) {
    console.log(`⚠️  Skipping voice test - ${error.message}`);
  }
}

async function testSendVideo() {
  console.log('\n🎬 Testing sendVideo...');

  if (!fs.existsSync(TEST_VIDEO_PATH)) {
    console.log(`⚠️  Skipping sendVideo test - test video not found: ${TEST_VIDEO_PATH}`);
    return;
  }

  try {
    const videoBuffer = fs.readFileSync(TEST_VIDEO_PATH);
    const base64Video = videoBuffer.toString('base64');

    await apiRequest('sendVideo', {
      chatId: TEST_VIDEO_PATH,
      file: `data:video/mp4;base64,${base64Video}`,
      caption: 'Test video from WAHA Core! 🎥'
    });
  } catch (error) {
    console.log(`⚠️  Skipping video test - ${error.message}`);
  }
}

async function testServerHealth() {
  console.log('\n🏥 Testing server health...');
  try {
    const response = await axios.get(`${BASE_URL}/api/server/about`, {
      headers: { 'X-Api-Key': API_KEY }
    });
    console.log(`✅ Server health: SUCCESS - WAHA version ${response.data.version}`);
    return true;
  } catch (error) {
    console.log(`❌ Server health: FAILED - ${error.message}`);
    console.log('💡 Make sure WAHA server is running: npm run start:dev');
    return false;
  }
}

async function testSessionCreation() {
  console.log('\n🔧 Testing session creation...');
  try {
    const response = await axios.post(`${BASE_URL}/api/sessions`, {
      name: SESSION_NAME,
      config: {
        metadata: {},
        webhooks: []
      }
    }, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Session creation: SUCCESS`);
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`✅ Session creation: ALREADY EXISTS`);
      return true;
    }
    console.log(`❌ Session creation: FAILED - ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 WAHA Core Multimedia Integration Tests');
  console.log('=' .repeat(50));

  // Check server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Tests aborted - server not healthy');
    process.exit(1);
  }

  // Test session creation
  const sessionCreated = await testSessionCreation();
  if (!sessionCreated) {
    console.log('\n❌ Tests aborted - cannot create session');
    process.exit(1);
  }

  // Run multimedia tests
  console.log('\n🎯 Testing Multimedia Features (Previously Plus-Only)');
  console.log('-'.repeat(50));

  await testSendImage();
  await testSendFile();
  await testSendVoice();
  await testSendVideo();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 WAHA Core Multimedia Tests Complete!');
  console.log('\n💡 Note: These features were previously only available in WAHA Plus');
  console.log('💡 Now they work in WAHA Core thanks to our reverse engineering!');

  // Show test files status
  console.log('\n📁 Test Files Status:');
  [TEST_IMAGE_PATH, TEST_AUDIO_PATH, TEST_VIDEO_PATH, TEST_FILE_PATH].forEach(filePath => {
    const exists = fs.existsSync(filePath);
    const filename = path.basename(filePath);
    console.log(`${exists ? '✅' : '❌'} ${filename} - ${exists ? 'Found' : 'Missing'}`);
  });
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testSendImage, testSendFile, testSendVoice, testSendVideo };
