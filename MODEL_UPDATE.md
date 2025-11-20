# ElevenLabs Model Update

## ✅ Fixed: Model Compatibility Issue

### Problem
The original model `eleven_monolingual_v1` is **no longer available on the free tier** as of 2024.

### Solution
Updated to use `eleven_turbo_v2` which is:
- ✅ **Free tier compatible**
- ⚡ **Faster** than the old model
- 🎵 **High quality** voice output
- 🌍 **Multi-language support**

### What Changed
Changed in `app/page.tsx`:
```javascript
// OLD (deprecated for free tier)
model_id: 'eleven_monolingual_v1'

// NEW (free tier compatible)
model_id: 'eleven_turbo_v2'
```

### Available Models (Free Tier)
- ✅ `eleven_turbo_v2` - Fast, high quality (recommended)
- ✅ `eleven_turbo_v2_5` - Latest version with improvements

### Available Models (Paid Tiers Only)
- ❌ `eleven_monolingual_v1` - Deprecated for free users
- ❌ `eleven_multilingual_v1` - Deprecated for free users
- ✅ `eleven_multilingual_v2` - Requires paid plan
- ✅ `eleven_english_v2` - Requires paid plan

### Testing Your Setup
After this change, your app should work with the free tier! Just:
1. Refresh your browser (Cmd+Shift+R)
2. Try generating a question
3. The voice should play without 401 errors

### Learn More
- [ElevenLabs Models Documentation](https://elevenlabs.io/docs/speech-synthesis/models)
- [Free Tier Limits](https://elevenlabs.io/pricing)
