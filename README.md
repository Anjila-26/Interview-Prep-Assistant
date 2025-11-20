This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Virtual Interview Assistant

An AI-powered interview practice application with natural voice synthesis using ElevenLabs API.

### Features
- 🎤 Voice-based interview practice with **ElevenLabs Speech-to-Text**
- 🤖 AI-generated interview questions using Google Gemini
- 🗣️ High-quality AI voice synthesis with ElevenLabs Text-to-Speech
- 📝 Accurate speech-to-text transcription with ElevenLabs
- 💬 Personalized interview feedback

### Setup

1. Get your API keys:
   - **Google Gemini API**: [Get API Key](https://ai.google.dev/)
   - **ElevenLabs API**: [Get API Key](https://elevenlabs.io/) (Supports both TTS and STT)

2. Add API keys to `.env.local`:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key_here
   ```

3. Or configure them in the app's settings panel (gear icon)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
