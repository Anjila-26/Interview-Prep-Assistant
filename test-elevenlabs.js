#!/usr/bin/env node

/**
 * Test ElevenLabs API Key
 * This script tests if your ElevenLabs API key is valid
 */

const ELEVENLABS_API_KEY = 'sk_bb028613030f5ebe94c7a811e36672203072e7233bd0c95b';

async function testElevenLabsAPI() {
  console.log('🔍 Testing ElevenLabs API Key...\n');
  console.log('API Key:', ELEVENLABS_API_KEY.substring(0, 10) + '...' + ELEVENLABS_API_KEY.slice(-5));
  console.log('');

  try {
    // Test 1: Check user info
    console.log('📋 Test 1: Fetching user information...');
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ Failed:', userResponse.status, errorText);
      console.log('\n💡 Possible issues:');
      console.log('  1. API key is invalid or expired');
      console.log('  2. Account needs activation');
      console.log('  3. Check https://elevenlabs.io/app/settings/api-keys');
      return;
    }

    const userData = await userResponse.json();
    console.log('✅ Success! User info:');
    console.log('   - Subscription:', userData.subscription?.tier || 'Free');
    console.log('   - Character count:', userData.subscription?.character_count || 0);
    console.log('   - Character limit:', userData.subscription?.character_limit || 10000);
    console.log('');

    // Test 2: Try to generate a short audio
    console.log('🎤 Test 2: Generating test audio...');
    const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: 'Hello, this is a test.',
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('❌ Failed:', ttsResponse.status, errorText);
      return;
    }

    const audioBlob = await ttsResponse.blob();
    console.log('✅ Success! Generated audio size:', audioBlob.size, 'bytes');
    console.log('');

    console.log('🎉 All tests passed! Your API key is working correctly.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('  1. Make sure your dev server is restarted');
    console.log('  2. Clear your browser cache (Cmd+Shift+R)');
    console.log('  3. Check browser console for any errors');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Check your internet connection and try again.');
  }
}

// Run the test
testElevenLabsAPI();
