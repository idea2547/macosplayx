'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Plus, ArrowLeft } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; id: string; }

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Msg = { role: 'user', content: text, id: `u_${Date.now()}` };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: `a_${Date.now()}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.', id: `err_${Date.now()}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const clearChat = () => { setMessages([]); setInput(''); };

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-text-primary font-semibold">CosplayMate</h1>
        <button onClick={clearChat} className="text-text-secondary hover:text-primary-light">
          <Plus size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-primary-glow flex items-center justify-center mb-4">
              <span className="text-4xl">🎭</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Hey there!</h2>
            <p className="text-text-secondary text-sm max-w-xs">
              I'm CosplayMate — ask me about outfits, events, wig styling, makeup, or anything cosplay! ✨
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {['Find a costume', 'Wig styling tips', 'Events near me', 'Makeup advice'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="bg-surface border border-border text-text-secondary text-xs px-3 py-2 rounded-full hover:border-primary/40 hover:text-primary-light transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-surface text-text-primary border border-border rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 bg-bg-elevated">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <input
            className="flex-1 bg-surface border border-border rounded-full px-5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50"
            placeholder="Ask about cosplay..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            maxLength={2000}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              input.trim() && !loading ? 'bg-primary hover:bg-primary-dark' : 'bg-text-muted'
            }`}
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
