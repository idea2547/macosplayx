# MaCosplayX — AI Cosplay Companion (Web)

🎭 Talk to CosplayMate AI. Discover outfits. Rent costumes. Connect with friends.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| AI Agent | Direct OpenAI API (gpt-4o) |
| Voice Input | Web Speech API (browser native) |
| Voice Output | Web Speech Synthesis API |
| Backend | PocketBase |
| State | Zustand |

## Architecture

```
macosplayx/
├── app/
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Tailwind + dark theme
│   ├── api/chat/route.ts # OpenAI chat API (server-side)
│   ├── voice/page.tsx    # Voice agent UI (call screen, waveform, avatar)
│   ├── chat/page.tsx     # Text chat with CosplayMate
│   ├── shop/page.tsx     # Outfit browser (products from PB)
│   ├── friends/page.tsx  # Friend connections
│   ├── login/page.tsx    # Sign in
│   └── signup/page.tsx   # Create account
├── lib/
│   ├── pocketbase.ts     # PB client + TypeScript types
│   └── cosplayAgent.ts   # OpenAI cosplay-specialized agent
└── public/
```

## Key Differences from WaifuClaw

- **No OpenClaw** — uses direct OpenAI API (gpt-4o) for AI responses
- **Web Speech API** for voice input (no WebSocket, no gateway)
- **Next.js App Router** instead of Expo Router
- **Tailwind CSS v4** instead of NativeWind
- **Server-side AI calls** — API key never exposed to browser

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Create env file
cp .env.example .env.local
# Edit .env.local with your OpenAI API key

# 3. Run
bun dev
```

## Features

- **Voice Chat** — Browser speech recognition (th-TH) → OpenAI → speech synthesis
- **Text Chat** — Message bubbles, session history, quick prompts
- **Shop** — Browse cosplay outfits with search, province filters, rental/sale
- **Friends** — Discover cosplayers, send/accept friend requests
- **Auth** — PocketBase email/password login

## PocketBase Collections Required

- `users` (auth collection)
- `chat_sessions`, `chat_messages`
- `products`, `user_store`
- `friend_connections`
- `cosplayer_profiles`
- `experience_notes`

Run `setup-collections.js` from the macosplay mobile project to create them.

## Design System

Dark-first theme. Purple primary (#7C3AED), pink secondary (#EC4899), teal accent (#14B8A6).

## Deploy

```bash
# Vercel (recommended)
vercel deploy

# Or build locally
bun build
bun start
```

---

© 2026 MaCosplayX
