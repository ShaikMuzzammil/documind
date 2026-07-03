<div align="center">

# DocuMind

**Intelligent Document Workspace — RAG-powered Q&A over your own files**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com)

[Live Demo](https://documind-chl35p8w4-shaik-muzzammils-projects.vercel.app) · [GitHub](https://github.com/ShaikMuzzammil/documind)

</div>

---

## What is DocuMind?

DocuMind is a **production-grade Retrieval-Augmented Generation (RAG) platform** built with Next.js 16. Upload documents, organise them into collections, and ask plain-language questions — every answer is grounded in your own files with source citations, not hallucinated.

```
you  > What are the key obligations in the Q3 contract?
dm   > Based on Section 4.2 of agreement-q3.pdf, the obligations are:
       (1) payment within 30 days of invoice,
       (2) quarterly performance reviews,
       (3) data confidentiality provisions.
cite > [Sources: agreement-q3.pdf p.8, nda-2024.pdf p.3] · 3 citations · 91% confidence
```

---

## Feature Set

| Area | What's included |
|---|---|
| **Upload** | PDF, Markdown, TXT, CSV, JSON, code files up to 15 MB |
| **Search** | Semantic vector search (cosine similarity / pgvector) |
| **Chat** | Streaming answers via Server-Sent Events |
| **Citations** | Per-message source links with page references |
| **Collections** | Organise documents into isolated project workspaces |
| **Analytics** | Upload trends, file type breakdown, chunk statistics |
| **Export** | Full workspace JSON export (documents + collections) |
| **Auth** | HMAC-signed session cookies, per-user data isolation |
| **Settings** | Profile editing, capability status, notification prefs |
| **Search** | Full-text semantic search across all documents |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router + Turbopack)                    │
│                                                         │
│  ┌───────────┐   ┌───────────┐   ┌──────────────────┐  │
│  │  /app     │   │  /api     │   │  proxy.ts         │  │
│  │  pages    │◄──│  routes   │   │  (Edge Runtime)   │  │
│  └───────────┘   └─────┬─────┘   └──────────────────┘  │
│                        │                                │
│  ┌─────────────────────▼───────────────────────────┐   │
│  │  lib/                                           │   │
│  │  ├── auth.ts       HMAC session tokens          │   │
│  │  ├── embeddings.ts Gemini text-embedding-004    │   │
│  │  ├── llm.ts        Gemini gemini-2.0-flash      │   │
│  │  ├── chunk.ts      Text splitter (512t / 64o)   │   │
│  │  └── storage/                                   │   │
│  │      ├── json-adapter.ts   (development)        │   │
│  │      └── postgres-adapter.ts (production)       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Storage strategy:** The app auto-detects whether `DATABASE_URL` is set.
- **Local JSON** (no env var): data lives in `/data/*.json`, great for local dev
- **Postgres + pgvector** (env var set): production-grade, Vercel / Neon / Supabase ready

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/ShaikMuzzammil/documind.git
cd documind
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required for AI answers
GEMINI_API_KEY=your_gemini_key_here

# Required in production (generates session tokens)
AUTH_SECRET=at-least-32-random-characters

# Optional — Postgres + pgvector (uses local JSON files without this)
DATABASE_URL=postgresql://user:password@host:5432/documind

# Optional — welcome emails
RESEND_API_KEY=your_resend_key
EMAIL_FROM=DocuMind <hello@yourdomain.com>
```

### 3. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

Set these environment variables in the Vercel dashboard:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `AUTH_SECRET` | ✅ | ≥32 char random string (`openssl rand -base64 32`) |
| `DATABASE_URL` | Recommended | Postgres connection string (Neon free tier works) |
| `RESEND_API_KEY` | Optional | For welcome emails |
| `EMAIL_FROM` | Optional | Sender address |

> **Vercel note:** The free Serverless filesystem is read-only. Set `DATABASE_URL` to persist data. Neon and Supabase both have generous free tiers.

---

## Project Structure

```
documind/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/page.tsx         # Login / Register
│   ├── chat/page.tsx         # RAG chat interface
│   ├── collections/page.tsx  # Collection manager
│   ├── documents/page.tsx    # Document manager
│   ├── analytics/page.tsx    # Usage charts
│   ├── export/page.tsx       # Data export
│   ├── search/page.tsx       # Semantic search
│   ├── settings/page.tsx     # User settings
│   ├── profile/page.tsx      # User profile
│   └── api/
│       ├── auth/             # Login, register, logout
│       ├── chat/             # Streaming RAG endpoint
│       ├── collections/      # CRUD collections
│       ├── documents/        # CRUD documents
│       ├── ingest/           # File upload + indexing
│       ├── me/               # User profile
│       ├── search/           # Semantic search
│       └── stats/            # Workspace analytics
├── components/
│   ├── app/                  # AuthGate, Citations, CollectionPicker
│   └── shared/               # Navigation, AppSidebar, Logo
├── lib/
│   ├── auth.ts               # Session token logic
│   ├── embeddings.ts         # Gemini embedding calls
│   ├── llm.ts                # Gemini chat + streaming
│   ├── chunk.ts              # Text chunking
│   ├── analytics.ts          # Stats aggregation
│   └── storage/              # JSON + Postgres adapters
└── proxy.ts                  # Edge-runtime route guard (Next.js 16)
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in, set session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/me` | Get current user |
| `PATCH` | `/api/me` | Update profile name |
| `GET` | `/api/collections` | List user collections |
| `POST` | `/api/collections` | Create collection |
| `DELETE` | `/api/collections/:id` | Delete collection + docs |
| `GET` | `/api/documents` | List documents (optionally filtered) |
| `POST` | `/api/ingest` | Upload + index a document |
| `DELETE` | `/api/documents/:id` | Delete document + chunks |
| `POST` | `/api/chat` | Streaming RAG answer |
| `POST` | `/api/search` | Semantic search query |
| `GET` | `/api/stats` | Workspace analytics data |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| AI — Answers | Google Gemini (gemini-2.0-flash) |
| AI — Embeddings | Google Gemini (text-embedding-004, 768 dim) |
| PDF parsing | pdf-parse v2 |
| Database | Postgres + pgvector (or local JSON) |
| Auth | HMAC-SHA256 signed cookies |
| Email | Resend |
| Deployment | Vercel |

---

## Changelog

### v3.2.1 (current)
- **Build fix**: Replaced `middleware.ts` with `proxy.ts` (Next.js 16 convention)
- **Build fix**: Rewrote route guard using Web Crypto API — no Node.js modules in Edge Runtime
- **Build fix**: Added `export const runtime = 'nodejs'` to all API routes
- **Build fix**: Fixed React version mismatch (19.0.0 → 19.2.7)
- **Landing page**: Complete redesign with animated stats, floating doc cards, checklist section, mobile nav
- **Auth page**: Enhanced UI with show/hide password, success states, better validation
- **Navigation**: Mobile hamburger menu, active section highlighting, "Get started" CTA

### v3.2.0
- Full rebuild: 104+ file codebase
- PostgreSQL + pgvector adapter
- Gemini AI integration with streaming
- Analytics dashboard
- Settings with 4 tabs
- Profile page
- Export page
- Semantic search page
- HMAC session auth

---

## Author

**Nova (Shaik Muzzammil)**
Computer Science & Engineering · Amrita Vishwa Vidyapeetham, Chennai (2028)
[GitHub: @ShaikMuzzammil](https://github.com/ShaikMuzzammil) · muzzammil160806@gmail.com

---

<div align="center">
  <sub>Built with Next.js, TypeScript, and Google Gemini · DocuMind v3.2.1</sub>
</div>
