'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, Settings, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Answer {
  question: string;
  answer: string;
  feedback?: string;
}

export default function VirtualInterviewAssistant() {
  const [stage, setStage] = useState<'setup' | 'interview' | 'feedback'>('setup');
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [immediateAnswerFeedback, setImmediateAnswerFeedback] = useState('');
  const [showingFeedback, setShowingFeedback] = useState(false);
  
  // API Keys
  const [geminiKey, setGeminiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  const [elevenlabsKey, setElevenlabsKey] = useState(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Text-to-speech function using ElevenLabs API
  const speakQuestion = useCallback(async (text: string) => {
    if (!elevenlabsKey) {
      setError('Please enter your ElevenLabs API key in settings');
      return;
    }

    try {
      setIsPlaying(true);
      
      // Using ElevenLabs TTS API with eleven_turbo_v2 (free tier compatible)
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsKey.trim()
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        // Get more detailed error information
        const errorData = await response.text();
        console.error('ElevenLabs API Error:', response.status, errorData);
        throw new Error(`ElevenLabs API Error: ${response.status} - ${errorData || response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          setError('Audio playback error');
        };
        await audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          setError('Audio playback error');
        };
        await audio.play();
      }
    } catch (err) {
      setIsPlaying(false);
      setError('Failed to generate voice: ' + (err as Error).message);
    }
  }, [elevenlabsKey]);

  // Speak the question using ElevenLabs TTS when stage changes to interview or question changes
  useEffect(() => {
    if (stage === 'interview' && questions.length > 0 && currentQuestion < questions.length) {
      speakQuestion(questions[currentQuestion]);
    }
  }, [stage, currentQuestion, questions, speakQuestion]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Generate questions using Gemini
  const generateQuestions = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (!geminiKey) {
      setError('Please enter your Gemini API key in settings');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate exactly 3 interview questions for the following job description. Return ONLY a JSON array of strings, nothing else.\n\nJob Description: ${jobDescription}`
            }]
          }]
        })
      });
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again, or upgrade your Gemini API plan at https://ai.google.dev/gemini-api/docs/rate-limits');
      }
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      const text = data.candidates[0].content.parts[0].text;
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const questionsArray = JSON.parse(cleanText);
      
      setQuestions(questionsArray);
      setStage('interview');
    } catch (err) {
      setError('Failed to generate questions: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Start recording audio for ElevenLabs STT
  const startRecording = async () => {
    if (!elevenlabsKey) {
      setError('Please enter your ElevenLabs API key in settings');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Failed to start recording: ' + (err as Error).message);
    }
  };

  // Stop recording and transcribe
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Transcribe audio using ElevenLabs STT
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!elevenlabsKey) {
      setError('Please enter your ElevenLabs API key in settings');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for ElevenLabs STT API
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model_id', 'scribe_v1');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsKey.trim()
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('ElevenLabs STT Error:', response.status, errorData);
        throw new Error(`ElevenLabs STT Error: ${response.status} - ${errorData || response.statusText}`);
      }

      const data = await response.json();
      const transcription = data.text || '';
      
      if (transcription) {
        setCurrentTranscript(prev => prev ? prev + ' ' + transcription : transcription);
      }
    } catch (err) {
      setError('Failed to transcribe audio: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Generate and speak immediate feedback after answer
  const generateImmediateFeedback = async (question: string, answer: string) => {
    try {
      setLoading(true);
      setShowingFeedback(true);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a supportive interview coach. The candidate just answered this question:

Question: ${question}
Answer: ${answer}

Provide brief, encouraging feedback in 2-3 short sentences (max 30 words). Focus on one positive aspect and one quick tip for improvement. Keep it conversational and uplifting.`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const feedbackText = data.candidates[0].content.parts[0].text;
      setImmediateAnswerFeedback(feedbackText);
      
      // Speak the feedback
      await speakQuestion(feedbackText);
      
      return feedbackText;
    } catch (err) {
      console.error('Failed to generate immediate feedback:', err);
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Submit answer and move to next question
  const submitAnswer = async () => {
    if (!currentTranscript.trim()) {
      setError('Please provide an answer');
      return;
    }
    
    const currentQuestionText = questions[currentQuestion];
    const currentAnswerText = currentTranscript;
    
    // Generate immediate feedback
    const feedbackText = await generateImmediateFeedback(currentQuestionText, currentAnswerText);
    
    // Save answer with feedback
    setAnswers([...answers, {
      question: currentQuestionText,
      answer: currentAnswerText,
      feedback: feedbackText
    }]);
    
    // Wait for audio to finish playing before continuing
    const waitForAudioToFinish = () => {
      return new Promise<void>((resolve) => {
        if (audioRef.current && !audioRef.current.paused) {
          // Audio is playing, wait for it to end
          audioRef.current.onended = () => {
            resolve();
          };
        } else {
          // Audio already finished or not playing
          resolve();
        }
      });
    };
    
    // Wait for feedback audio to complete, then add a 1 second pause
    await waitForAudioToFinish();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now move to next question
    setCurrentTranscript('');
    setImmediateAnswerFeedback('');
    setShowingFeedback(false);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      evaluateInterview();
    }
  };

  // Evaluate interview using Gemini
  const evaluateInterview = async () => {
    setLoading(true);
    setStage('feedback');
    
    try {
      const qaText = answers.map((qa, i) => 
        `Question ${i + 1}: ${qa.question}\nAnswer: ${qa.answer}\nImmediate Feedback: ${qa.feedback || 'N/A'}`
      ).join('\n\n');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a supportive interview coach helping someone prepare for this job: ${jobDescription}\n\n${qaText}\n\nProvide comprehensive summary feedback that:\n1. Gives an overall assessment of their interview performance\n2. Highlights consistent strengths across all answers\n3. Identifies key areas for improvement with specific examples\n4. Provides actionable strategies to enhance their interview skills\n5. Celebrates their effort and progress\n6. Ends with an uplifting, motivational message\n\nNote: Brief feedback was already given after each answer. This should be a holistic summary.\n\nTone: Friendly, supportive, and encouraging - like a mentor helping them succeed, not a critic pointing out flaws.`
            }]
          }]
        })
      });
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again, or upgrade your Gemini API plan at https://ai.google.dev/gemini-api/docs/rate-limits');
      }
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setFeedback(data.candidates[0].content.parts[0].text);
    } catch (err) {
      setError('Failed to generate feedback: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Reset interview
  const resetInterview = () => {
    setStage('setup');
    setJobDescription('');
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentTranscript('');
    setFeedback('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#B8C5E8]">
      {/* Header - Fixed at top */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase" style={{ fontFamily: 'var(--font-lores-bold)' }}>
            Virtual Interview Assistant
          </h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Settings className="w-7 h-7 text-gray-800" />
          </button>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ElevenLabs API Key
                </label>
                <input
                  type="password"
                  value={elevenlabsKey}
                  onChange={(e) => setElevenlabsKey(e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500">
                Gemini API key is required for question generation and feedback. ElevenLabs API key is required for both AI voice synthesis (TTS) and speech recognition (STT).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Centered */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="w-full max-w-4xl">

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Setup Stage */}
        {stage === 'setup' && (
          <div className="bg-white rounded-lg shadow-lg p-8 relative">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center" style={{ fontFamily: 'var(--font-lores-bold)' }}>Enter Job Description</h2>
            
            {/* Textarea */}
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here ...."
              className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-black"
            />
            
            {/* START Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={generateQuestions}
                disabled={loading}
                className="relative disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <div className="bg-indigo-600 px-20 py-4 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 mr-2 animate-spin text-white" />
                    <span className="text-white font-bold text-xl">LOADING...</span>
                  </div>
                ) : (
                  <img 
                    src="/images/start_button.svg" 
                    alt="Start Interview" 
                    className="w-64 h-auto cursor-pointer"
                  />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Interview Stage */}
        {stage === 'interview' && (
          <div className="relative min-h-[70vh] flex flex-col items-center justify-center">
            {/* Question Number - Subtle top indicator */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <p className="text-black/80 text-sm font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>
            </div>

            {/* Voice Visualization with Wobble Effect */}
            <div className="relative flex items-center justify-center mb-16">
              {/* Outer ripple rings (only show when speaking) */}
              {isPlaying && (
                <>
                  <div className="absolute w-96 h-96 rounded-full bg-white/10 animate-ping"></div>
                  <div className="absolute w-80 h-80 rounded-full bg-white/15 animate-pulse"></div>
                  <div className="absolute w-64 h-64 rounded-full bg-white/20 animate-ping animation-delay-150"></div>
                </>
              )}
              
              {/* Main avatar circle with wobble */}
              <div className={`relative w-48 h-48 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl ${isPlaying ? 'animate-wobble' : ''}`}>
                <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                  {isPlaying ? (
                    <div className="flex gap-1.5 items-end h-16">
                      <div className="w-2.5 bg-white rounded-full animate-wave h-6"></div>
                      <div className="w-2.5 bg-white rounded-full animate-wave h-12 animation-delay-100"></div>
                      <div className="w-2.5 bg-white rounded-full animate-wave h-8 animation-delay-200"></div>
                      <div className="w-2.5 bg-white rounded-full animate-wave h-14 animation-delay-300"></div>
                      <div className="w-2.5 bg-white rounded-full animate-wave h-10 animation-delay-400"></div>
                      <div className="w-2.5 bg-white rounded-full animate-wave h-12 animation-delay-100"></div>
                      <div className="w-2.5 bg-white rounded-full animate-wave h-7 animation-delay-200"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      {isRecording ? (
                        <Mic className="w-16 h-16 text-white animate-pulse" />
                      ) : (
                        <Pause className="w-16 h-16 text-white/80" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="text-center mb-12">
              {showingFeedback && immediateAnswerFeedback && (
                <div className="space-y-2 max-w-2xl mx-auto">
                  <p className="text-white text-xl font-medium">
                    💬 Quick Feedback
                  </p>
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <p className="text-white/90 text-center">{immediateAnswerFeedback}</p>
                  </div>
                  <p className="text-white/60 text-sm">Moving to next question...</p>
                </div>
              )}
              {!showingFeedback && isPlaying && (
                <div className="space-y-2">
                  <p className="text-white text-xl font-medium animate-pulse">
                    🎙️ AI Interviewer is speaking...
                  </p>
                  <p className="text-white/60 text-sm">Listen carefully</p>
                </div>
              )}
              {!showingFeedback && isRecording && (
                <div className="space-y-2">
                  <p className="text-white text-xl font-medium animate-pulse">
                    🎤 Recording your answer...
                  </p>
                  <p className="text-white/60 text-sm">Speak clearly and confidently</p>
                </div>
              )}
              {!showingFeedback && !isPlaying && !isRecording && currentTranscript && (
                <div className="space-y-2">
                  <p className="text-white text-xl font-medium">
                    ✓ Answer captured
                  </p>
                  <p className="text-white/60 text-sm">Ready to continue?</p>
                </div>
              )}
              {!showingFeedback && !isPlaying && !isRecording && !currentTranscript && (
                <div className="space-y-2">
                  <p className="text-white text-xl font-medium">
                    Ready to answer?
                  </p>
                  <p className="text-white/60 text-sm">Press the microphone when ready</p>
                </div>
              )}
            </div>

            {/* Transcription preview - floating at bottom */}
            {currentTranscript && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <p className="text-white/90 text-center italic">"{currentTranscript}"</p>
                </div>
              </div>
            )}

            {/* Control Buttons - floating at bottom */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 items-center">
              {/* Replay button */}
              <button
                onClick={() => speakQuestion(questions[currentQuestion])}
                disabled={isPlaying || isRecording}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all hover:scale-110 disabled:opacity-40"
                title="Replay question"
              >
                <Play className="w-6 h-6 text-white" />
              </button>

              {/* Main record/stop button - larger */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isPlaying}
                className={`p-8 rounded-full transition-all hover:scale-110 shadow-2xl border-4 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 border-red-300 animate-pulse'
                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border-white/30'
                } disabled:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>

              {/* Submit/Next button */}
              <button
                onClick={submitAnswer}
                disabled={loading || !currentTranscript || isRecording || showingFeedback}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all hover:scale-110 disabled:opacity-40"
                title={currentQuestion < questions.length - 1 ? 'Next question' : 'Finish interview'}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Stage */}
        {stage === 'feedback' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Interview Feedback</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Analyzing your responses...</span>
              </div>
            ) : (
              <>
                <div className="prose prose-slate max-w-none mb-6 p-6 bg-gray-50 rounded-lg">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-800 mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 text-gray-800 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 text-gray-800 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-800 ml-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                      code: ({node, ...props}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono text-gray-900" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-gray-200 p-3 rounded mb-3 overflow-x-auto" {...props} />,
                    }}
                  >
                    {feedback}
                  </ReactMarkdown>
                </div>
                <button
                  onClick={resetInterview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
                >
                  Start New Interview
                </button>
              </>
            )}
          </div>
        )}

        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        </div>
      </div>
    </div>
  );
}