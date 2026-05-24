'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, ArrowLeft, Sparkles, Zap, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Expression = 'neutral' | 'happy' | 'thinking' | 'talking' | 'listening' | 'excited';
const EMOJI: Record<Expression, string> = { 
  neutral: '🎭', 
  happy: '😊', 
  thinking: '🤔', 
  talking: '💬', 
  listening: '👂',
  excited: '🤩'
};

export default function VoicePage() {
  const router = useRouter();
  const [isCalling, setIsCalling] = useState(false);
  const [expression, setExpression] = useState<Expression>('neutral');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);
  const recognitionRef = useRef<any>(null);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);

  // Generate floating particles
  useEffect(() => {
    setParticles(Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 10,
    })));
  }, []);

  // Duration timer
  useEffect(() => {
    if (!isCalling) return;
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [isCalling]);

  // Expression cycling
  useEffect(() => {
    if (!isCalling) return;
    const cycle = setInterval(() => {
      const states: Expression[] = ['talking', 'listening', 'thinking', 'happy', 'excited'];
      setExpression(states[Math.floor(Math.random() * states.length)]);
    }, 3000);
    return () => clearInterval(cycle);
  }, [isCalling]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const sendToAI = useCallback(async (text: string) => {
    setExpression('thinking');
    try {
      // Try action API first (for action-oriented commands)
      const actionRes = await fetch('/api/voice/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      
      if (actionRes.ok) {
        const actionData = await actionRes.json();
        
        // If it's an action intent, execute and respond
        if (actionData.action && actionData.action !== 'ask_question' && actionData.action !== 'unknown') {
          setAiReply(actionData.suggestedResponse || actionData.message || 'ดำเนินการเรียบร้อยแล้ว ✨');
          conversationRef.current.push(
            { role: 'user', content: text },
            { role: 'assistant', content: actionData.suggestedResponse || 'ดำเนินการเรียบร้อยแล้ว' }
          );
          setExpression('happy');
          speakText(actionData.suggestedResponse || 'ดำเนินการเรียบร้อยแล้ว');
          return;
        }
      }
      
      // Fallback to chat API for general conversation
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: conversationRef.current }),
      });
      const data = await res.json();
      if (data.reply) {
        setAiReply(data.reply);
        conversationRef.current.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply });
        setExpression('talking');
        speakText(data.reply);
      }
    } catch (err) {
      console.error('AI error:', err);
      setExpression('neutral');
    }
  }, []);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'th-TH';
    utter.rate = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => { setIsSpeaking(false); setExpression('happy'); };
    window.speechSynthesis.speak(utter);
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (e: any) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final + interim);
      if (final) {
        setExpression('listening');
        sendToAI(final);
      }
    };

    recognition.onerror = () => { setIsListening(false); setExpression('neutral'); };
    recognition.onend = () => {
      setIsListening(false);
      if (isCalling && !isMuted) {
        try { recognition.start(); setIsListening(true); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setExpression('listening');
  }, [isCalling, isMuted, sendToAI]);

  const startCall = () => {
    setIsCalling(true);
    setExpression('happy');
    setDuration(0);
    conversationRef.current = [];
    setTranscript('');
    setAiReply('');
    startListening();
  };

  const endCall = () => {
    setIsCalling(false);
    setIsListening(false);
    setIsSpeaking(false);
    setExpression('neutral');
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
  };

  // ─── Active Call View ────────────────────────────────────────────────────
  if (isCalling) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F0F1A] via-[#1A1A2E] to-[#0F0F1A] overflow-hidden relative">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-primary/20"
              style={{ width: p.size, height: p.size }}
              initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0 }}
              animate={{ 
                y: [`${p.y}%`, `${p.y - 30}%`, `${p.y}%`],
                opacity: [0, 0.6, 0],
              }}
              transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4">
          <button onClick={endCall} className="text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <motion.div 
            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-sm"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </motion.div>
        </div>

        {/* Center - Avatar Orb */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {/* Glowing Orb Container */}
          <motion.div 
            className="relative mb-8"
            animate={{ 
              scale: expression === 'talking' ? [1, 1.08, 1] : 1,
            }}
            transition={{ duration: 0.8, repeat: expression === 'talking' ? Infinity : 0 }}
          >
            {/* Outer Glow Rings */}
            <motion.div 
              className="absolute inset-0 rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
                transform: 'scale(2)',
              }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1.8, 2.2, 1.8],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Middle Glow */}
            <motion.div 
              className="absolute inset-0 rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 60%)',
                transform: 'scale(1.5)',
              }}
              animate={{ 
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />

            {/* Main Orb */}
            <motion.div 
              className="w-48 h-48 rounded-full flex items-center justify-center relative z-10"
              style={{ 
                background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                boxShadow: '0 0 60px rgba(124,58,237,0.5), inset 0 0 40px rgba(255,255,255,0.1)',
              }}
              animate={{
                boxShadow: [
                  '0 0 60px rgba(124,58,237,0.5)',
                  '0 0 80px rgba(236,72,153,0.6)',
                  '0 0 60px rgba(124,58,237,0.5)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {/* Inner Highlight */}
              <div className="absolute top-8 left-10 w-16 h-10 rounded-full bg-white/10 blur-md" />
              
              {/* Emoji */}
              <motion.span 
                className="text-7xl relative z-20"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                {EMOJI[expression]}
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Name & Duration */}
          <motion.h2 
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            CosplayMate
          </motion.h2>
          <motion.p 
            className="text-text-secondary text-2xl font-mono mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {formatTime(duration)}
          </motion.p>

          {/* Transcript */}
          <div className="mt-8 max-w-md w-full text-center space-y-2">
            <AnimatePresence>
              {transcript && (
                <motion.p 
                  className="text-text-secondary text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-text-muted">You:</span> {transcript}
                </motion.p>
              )}
              {aiReply && (
                <motion.p 
                  className="text-primary-light text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {aiReply.slice(0, 200)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Animated Waveform */}
          <div className="flex items-center justify-center gap-1 h-16 mt-8">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 rounded-full"
                style={{
                  background: `linear-gradient(to top, ${expression === 'talking' ? '#A78BFA' : expression === 'listening' ? '#F59E0B' : '#6B6B80'}, transparent)`,
                }}
                animate={{
                  height: isListening || isSpeaking
                    ? [8, 20 + Math.random() * 40, 8]
                    : 8,
                }}
                transition={{
                  duration: 0.6,
                  repeat: isListening || isSpeaking ? Infinity : 0,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center justify-center gap-6 pb-8">
          <motion.button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20' : 'bg-surface/80 backdrop-blur-sm'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? <MicOff size={24} className="text-red-400" /> : <Mic size={24} className="text-text-primary" />}
          </motion.button>
          
          <motion.button 
            onClick={endCall}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <PhoneOff size={28} className="text-white" />
          </motion.button>
          
          <motion.button 
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${speakerOn ? 'bg-primary/30' : 'bg-surface/80 backdrop-blur-sm'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {speakerOn ? <Volume2 size={24} className="text-text-primary" /> : <VolumeX size={24} className="text-text-primary" />}
          </motion.button>
        </div>
      </div>
    );
  }

  // ─── Pre-Call View ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F1A] via-[#1A1A2E] to-[#0F0F1A] overflow-hidden relative flex flex-col items-center justify-center px-6">
      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-primary/10"
            style={{ width: p.size * 1.5, height: p.size * 1.5 }}
            initial={{ x: `${p.x}%`, y: '100%', opacity: 0 }}
            animate={{ 
              y: '-20%',
              opacity: [0, 0.3, 0],
            }}
            transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <button onClick={() => router.back()} className="absolute top-6 left-6 text-text-secondary hover:text-text-primary z-10">
        <ArrowLeft size={20} />
      </button>

      {/* Animated Orb */}
      <motion.div 
        className="relative mb-8"
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="w-40 h-40 rounded-full flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            boxShadow: '0 0 60px rgba(124,58,237,0.5), inset 0 0 40px rgba(255,255,255,0.1)',
          }}
        >
          <div className="absolute top-6 left-8 w-12 h-8 rounded-full bg-white/10 blur-md" />
          <span className="text-6xl relative z-10">{EMOJI[expression]}</span>
        </div>
      </motion.div>

      <motion.h1 
        className="text-4xl font-bold text-text-primary mb-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Voice Chat
      </motion.h1>
      <motion.p 
        className="text-text-secondary text-center max-w-sm mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Talk to CosplayMate about costumes, events, tips, and more ✨
      </motion.p>

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-3 mb-10 max-w-sm w-full">
        {[
          { icon: Zap, title: 'Real-Time', desc: 'Instant voice', color: 'text-accent' },
          { icon: Sparkles, title: 'AI Powered', desc: 'Knows cosplay', color: 'text-primary-light' },
          { icon: Heart, title: 'Personal', desc: 'Learns from you', color: 'text-secondary' },
        ].map(f => (
          <motion.div 
            key={f.title}
            className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 text-center"
            whileHover={{ scale: 1.05, borderColor: 'rgba(124,58,237,0.4)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <f.icon className={`w-6 h-6 mx-auto mb-2 ${f.color}`} />
            <p className="text-text-primary text-sm font-semibold">{f.title}</p>
            <p className="text-text-muted text-xs">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Call Button */}
      <motion.button
        onClick={startCall}
        className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-full text-lg transition-all shadow-lg shadow-emerald-500/40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Mic size={22} />
        Call CosplayMate
      </motion.button>
      <motion.p 
        className="text-text-muted text-xs mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Uses browser speech recognition + OpenAI
      </motion.p>
    </div>
  );
}
