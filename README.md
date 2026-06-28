# 🧠 DocuMind — Document Intelligence Platform

> **Upload any document. Ask anything. Get cited, grounded answers from your own data.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ What is DocuMind?

DocuMind is a **production-grade RAG (Retrieval-Augmented Generation) platform** that lets you upload documents and query them through a streaming AI chat interface with full source citations. Every answer is grounded in your actual documents — not hallucinated from general knowledge.

```
Upload Docs → Semantic Chunking → 768-dim Embeddings → Vector Search → Cited AI Answer
```

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 💬 **AI Chat** | Streaming answers with numbered citations and confidence scores |
| 📄 **Smart Upload** | PDF, TXT, MD, CSV, JSON, TS/JS/PY — multi-file drag-drop with progress |
| 📁 **Collections** | Organize documents into isolated workspaces |
| 🔍 **Semantic Search** | Hybrid vector + keyword search across all documents |
| 📊 **Analytics Dashboard** | Document health, chunk coverage, collection stats (Recharts) |
| 🧩 **Schema Extraction** | AI batch-extracts structured fields from entire collections → CSV/JSON |
| 🛡️ **PII Scanner** | Detect & redact emails, SSNs, credit cards, phone numbers |
| 👁️ **Chunk Viewer** | Inspect indexed document chunks with stats |
| ⚡ **Dashboard** | Workspace overview with activity timeline, system status |
| 📤 **Multi-format Export** | CSV, JSON, Markdown chat export |
| ⌨️ **Keyboard Shortcuts** | ⌘K search, full shortcuts panel |
| 🔑 **Secure Auth** | HMAC-SHA256 session cookies, no external auth dependency |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DocuMind RAG Pipeline                       │
├──────────┬──────────┬────────────┬───────────┬──────────────────┤
│  Ingest  │  Chunk   │   Embed    │   Index   │   Query/Answer   │
│  PDF/TXT │ Semantic │  768-dim   │ pgvector  │ LLM + SSE stream │
│  MD/CSV  │ boundary │  AI model  │  cosine   │ + inline cites   │
│  JSON/TS │ overlap  │  batchEmbed│  IVFFlat  │ confidence score │
└──────────┴──────────┴────────────┴───────────┴──────────────────┘
```

**Tech Stack:**
- **Framework:** Next.js 16.2.9 (App Router) · React 19
- **Language:** TypeScript 5.7 (strict mode)
- **AI:** Streaming REST API (Gemini 2.0 Flash / text-embedding-004)
- **Database:** PostgreSQL + pgvector **or** local JSON file store (auto-detected)
- **Auth:** HMAC-SHA256 session cookies (zero external deps)
- **Styling:** Tailwind CSS 3.4 + Framer Motion 12
- **Charts:** Recharts 2.13
- **Icons:** Lucide React

---

## 📦 Project Structure

```
documind/
├── app/
│   ├── page.tsx              # Landing page (9 sections, interactive demo)
│   ├── layout.tsx            # Root layout + Navigation + Sidebar + Toast
│   ├── globals.css           # Tailwind + custom design tokens
│   ├── workspace/page.tsx    # Main dashboard with activity + health
│   ├── chat/page.tsx         # Streaming AI chat with citations
│   ├── documents/page.tsx    # Upload, browse, view chunks
│   ├── collections/page.tsx  # Collection management + inline edit
│   ├── analytics/page.tsx    # Recharts analytics dashboard
│   ├── export/page.tsx       # Export + Schema Extraction + PII Scanner
│   ├── search/page.tsx       # Hybrid semantic + keyword search
│   ├── profile/page.tsx      # User profile + usage stats
│   ├── settings/page.tsx     # Profile, AI prefs, privacy
│   ├── help/page.tsx         # Full help center + FAQ
│   ├── auth/page.tsx         # Sign in / Register
│   └── api/                  # 24 API routes
│       ├── chat/             # Streaming RAG chat
│       ├── ingest/           # Document upload + indexing
│       ├── search/           # Hybrid search
│       ├── schema-extract/   # AI batch extraction
│       ├── pii-detect/       # PII detection + redaction
│       ├── workspace/        # Dashboard stats
│       ├── analytics/        # Aggregated stats
│       ├── export/           # CSV, JSON, Markdown, schema exports
│       ├── documents/[id]/   # Document + chunk management
│       ├── collections/[id]/ # Collection CRUD + stats
│       ├── user/stats/       # User statistics
│       └── me/               # Profile GET + PATCH
├── components/
│   ├── shared/
│   │   ├── Navigation.tsx    # Sticky nav with section highlighting
│   │   └── AppSidebar.tsx    # Sidebar with ⌘K search, user display
│   └── app/
│       ├── Citations.tsx     # Source citations with confidence bars
│       ├── DocumentCard.tsx  # Rich card with chunk viewer drawer
│       ├── DocumentViewer.tsx# Chunk inspector with stats
│       ├── PIIScanner.tsx    # PII detection UI
│       ├── SearchPanel.tsx   # ⌘K global search overlay
│       ├── ChatSuggestions.tsx # Smart suggested questions
│       ├── OnboardingModal.tsx # 3-step first-run guide
│       ├── KeyboardShortcuts.tsx
│       ├── LoadingSkeleton.tsx # All skeleton states
│       ├── StatsCard.tsx
│       ├── RecentActivity.tsx
│       ├── ConfirmModal.tsx
│       ├── EmptyState.tsx
│       ├── ProgressBar.tsx
│       ├── StatusBadge.tsx
│       └── Toast.tsx         # Global notification system
├── lib/
│   ├── store.ts              # Unified DB adapter (Postgres or JSON)
│   ├── db-json.ts            # JSON file store (dev/demo)
│   ├── db-postgres.ts        # PostgreSQL + pgvector
│   ├── storage/              # Backward-compatible storage interfaces
│   ├── llm.ts                # Streaming AI with quota error handling
│   ├── embeddings.ts         # Batch embeddings with fallback
│   ├── pii.ts                # PII detection engine
│   ├── search.ts             # BM25 + highlight utilities
│   ├── analytics-utils.ts    # Collection health + time series
│   ├── auth.ts               # HMAC session management
│   ├── chunk.ts              # Semantic text chunker
│   ├── validators.ts         # Input validation
│   ├── format.ts             # Date, bytes, number formatting
│   ├── constants.ts          # App-wide constants
│   ├── cn.ts                 # className utility
│   ├── use-user.ts           # User state hook
│   ├── use-collections.ts    # Collections hook
│   └── hooks/                # useDebounce, useAsync, usePagination, etc.
├── public/favicon.svg
├── middleware.ts             # Route protection
├── postcss.config.js         # Tailwind PostCSS
├── tailwind.config.ts        # Custom color tokens
├── next.config.ts            # Next.js 16.2.9 config
├── tsconfig.json
├── vercel.json
└── .env.example
```

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
AI_API_KEY=your_gemini_api_key_from_aistudio.google.com
AUTH_SECRET=your_random_secret   # openssl rand -base64 32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **No database needed for dev** — uses local `.data/` JSON store automatically.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Create account → Create collection → Upload a document → Chat 🎉

---

## 🌐 Deploy to Vercel (Free)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: DocuMind v3 — document intelligence platform"
git remote add origin https://github.com/YOUR_USERNAME/documind.git
git push -u origin main
```

### Step 2 — Import on Vercel

[vercel.com/new](https://vercel.com/new) → Import repo → Framework auto-detected as **Next.js**.

### Step 3 — Set Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `AI_API_KEY` | From [aistudio.google.com](https://aistudio.google.com) | ✅ |
| `AUTH_SECRET` | `openssl rand -base64 32` | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | Optional |
| `DATABASE_SSL` | `true` | Optional |
| `AI_CHAT_MODEL` | `gemini-2.0-flash` (default) | Optional |
| `AI_EMBED_MODEL` | `text-embedding-004` (default) | Optional |
| `RESEND_API_KEY` | For welcome emails | Optional |

### Step 4 — Free Database: Neon

1. Sign up at [neon.tech](https://neon.tech) → Create project
2. Copy connection string: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
3. Add as `DATABASE_URL` in Vercel + set `DATABASE_SSL=true`
4. pgvector is pre-enabled on Neon — tables auto-created on first request ✓

### Step 5 — Deploy

Click **Deploy** → ~90 seconds → Live ✓

---

## 🗺️ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/me` | Current user info |
| `PATCH` | `/api/me` | Update name / password |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `POST` | `/api/ingest` | Upload + chunk + embed document |
| `POST` | `/api/chat` | Streaming RAG chat (SSE) |
| `GET` | `/api/search` | Hybrid semantic + keyword search |
| `POST` | `/api/schema-extract` | AI batch field extraction |
| `POST` | `/api/pii-detect` | PII detection + redaction |
| `GET` | `/api/workspace` | Dashboard overview + activity |
| `GET` | `/api/analytics` | Full workspace analytics |
| `GET` | `/api/documents` | List documents |
| `DELETE` | `/api/documents/:id` | Delete document + chunks |
| `GET` | `/api/documents/:id/chunks` | View indexed chunks |
| `GET` | `/api/collections` | List collections |
| `POST` | `/api/collections` | Create collection |
| `PATCH` | `/api/collections/:id` | Update collection |
| `DELETE` | `/api/collections/:id` | Delete collection |
| `GET` | `/api/collections/:id/stats` | Collection health stats |
| `GET` | `/api/export/documents` | Export CSV |
| `GET` | `/api/export/collections` | Export JSON |
| `POST` | `/api/export/chat` | Export chat as Markdown |
| `POST` | `/api/export/schema` | Download schema template |
| `GET` | `/api/user/stats` | User statistics + activity |
| `GET` | `/api/health` | Health check endpoint |

---

## 🔒 Security

- **HMAC-SHA256** session cookies (no JWT, no OAuth dependency)
- **Per-user namespace isolation** — no cross-user data leakage
- **PII detection** — 7 PII types detected and auto-redacted before sharing
- **Security HTTP headers** — X-Frame-Options, CSP, X-Content-Type-Options
- **Input validation** — all endpoints validate with `lib/validators.ts`
- **Rate limiting** — graceful quota handling for AI API calls
- **No secrets exposed** — all AI/DB keys server-side only

---

## 🗺️ Roadmap

- [ ] GraphRAG — cross-document knowledge graph extraction  
- [ ] Layout-aware PDF parsing (table + chart recognition)  
- [ ] Bounding-box PDF citations (click to jump to page)  
- [ ] Team workspaces with RBAC  
- [ ] Webhook on document processing completion  
- [ ] Fine-tuned embedding model support  

---

## 📄 License

MIT — modify and deploy freely.

---

<p align="center">
  Built with ❤️ using Next.js 16 · TypeScript · Tailwind CSS · pgvector
</p>
