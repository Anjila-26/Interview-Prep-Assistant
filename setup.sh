#!/bin/bash

# Quick Setup Script for ElevenLabs Integration
# This script helps you set up your .env.local file with API keys

echo "🎤 Virtual Interview Assistant - ElevenLabs Setup"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

echo "Please enter your API keys:"
echo ""

# Prompt for Gemini API Key
read -p "Google Gemini API Key: " GEMINI_KEY

# Prompt for ElevenLabs API Key
read -p "ElevenLabs API Key: " ELEVENLABS_KEY

# Create .env.local file
cat > .env.local << EOF
# Google Gemini API Key for question generation and feedback
NEXT_PUBLIC_GEMINI_API_KEY=$GEMINI_KEY

# ElevenLabs API Key for voice synthesis
NEXT_PUBLIC_ELEVENLABS_API_KEY=$ELEVENLABS_KEY
EOF

echo ""
echo "✅ Configuration saved to .env.local"
echo ""
echo "📚 Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📖 For more information:"
echo "   - ElevenLabs setup: See ELEVENLABS_SETUP.md"
echo "   - Changes summary: See CHANGES_SUMMARY.md"
echo ""
echo "🎉 Happy interviewing!"
