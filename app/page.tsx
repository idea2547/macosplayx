'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, MessageCircle, ShoppingBag, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F1A] via-[#1A1A2E] to-[#0F0F1A] overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10"
            style={{ 
              width: Math.random() * 6 + 2, 
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ 
              y: '-20%',
              opacity: [0, 0.3, 0],
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 bg-primary/20 text-primary-light text-sm font-medium px-5 py-2 rounded-full mb-8 backdrop-blur-sm border border-primary/30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          AI-Powered Cosplay Companion
        </motion.div>

        {/* Logo */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="absolute inset-0 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)' }}
          />
          <motion.div
            className="w-24 h-24 rounded-full flex items-center justify-center relative z-10"
            style={{ 
              background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
              boxShadow: '0 0 60px rgba(124,58,237,0.5)',
            }}
            animate={{
              boxShadow: ['0 0 60px rgba(124,58,237,0.5)', '0 0 80px rgba(236,72,153,0.6)', '0 0 60px rgba(124,58,237,0.5)'],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span className="text-5xl">🎭</span>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-secondary to-primary-light">Ma</span>
          <span className="text-text-primary">Cosplay</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary-light">X</span>
        </motion.h1>

        <motion.p 
          className="text-text-secondary text-lg md:text-xl max-w-md mx-auto text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Your AI cosplay companion. Talk, discover outfits, rent costumes, and connect with friends.
        </motion.p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link
              href="/voice"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-full transition-all text-base shadow-lg shadow-emerald-500/40"
            >
              <Mic size={20} />
              Start Voice Chat
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link
              href="/chat"
              className="inline-flex items-center gap-3 bg-surface/80 hover:bg-surface text-text-primary font-semibold px-8 py-4 rounded-full border border-border hover:border-primary/40 transition-all text-base backdrop-blur-sm"
            >
              <MessageCircle size={20} />
              Text Chat
            </Link>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full">
          {[
            { icon: Mic, title: 'Voice Agent', desc: 'Talk to CosplayMate AI', href: '/voice', gradient: 'from-primary/20 to-secondary/20' },
            { icon: ShoppingBag, title: 'Shop & Rent', desc: 'Browse outfits & shops', href: '/shop', gradient: 'from-secondary/20 to-accent/20' },
            { icon: Users, title: 'Connect', desc: 'Find cosplay friends', href: '/friends', gradient: 'from-accent/20 to-primary/20' },
            { icon: Sparkles, title: 'Experience', desc: 'Share your journey', href: '/notes', gradient: 'from-primary/20 to-accent/20' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + i * 0.1 }}
            >
              <Link href={f.href} className={`group bg-gradient-to-br ${f.gradient} border border-border/50 hover:border-primary/40 rounded-2xl p-6 transition-all backdrop-blur-sm hover:scale-105 block`}>
                <div className="w-12 h-12 rounded-full bg-surface/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={22} className="text-text-primary" />
                </div>
                <h3 className="text-text-primary font-semibold mb-1 group-hover:text-primary-light transition-colors">{f.title}</h3>
                <p className="text-text-muted text-sm">{f.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
