<div align="center">

# 🧠 DocuMind

### AI Document Intelligence — Powered by Google Gemini

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Upload documents · Ask questions · Get cited, grounded answers**

</div>

---

## ✨ Overview

DocuMind is a production-grade **RAG (Retrieval-Augmented Generation)** workspace. Upload PDFs, notes, and code files into isolated collections — then ask questions and get structured, cited answers grounded in your own documents.

**No hallucinations.** If the answer is not in your documents, DocuMind says so.

---

## 🚀 Quick Start (5 minutes)

### 1. Clone

```bash
git clone https://github.com/ShaikMuzzammil/documind.git
cd documind
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Minimum required:
```env
GEMINI_API_KEY=AIza...        # https://aistudio.google.com/app/apikey
AUTH_SECRET=<random-string>   # openssl rand -base64 32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run

```bash
npm run dev
```

---

## ☁️ Deploy to Vercel (Production)

### Step 1 — Push to GitHub
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOU/documind.git
git push -u origin main
```

### Step 2 — Import on Vercel
Go to **vercel.com/new** → Import your repo → Framework auto-detected as **Next.js 16**.

### Step 3 — Environment Variables

Add these in **Project Settings → Environment Variables** (scope: Production + Preview + Development):

| Variable | Value | Required |
|---|---|---|
| `GEMINI_API_KEY` | `AIza...` from aistudio.google.com | ✅ |
| `AUTH_SECRET` | `openssl rand -base64 32` output | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | ✅ |
| `DATABASE_URL` | `postgresql://...` (Neon / Supabase) | Prod |
| `DATABASE_SSL` | `true` | Prod |
| `RESEND_API_KEY` | From resend.com | Optional |
| `EMAIL_FROM` | `DocuMind <noreply@yourdomain.com>` | Optional |

### Step 4 — Free Database: Neon
1. Create project at **neon.tech**
2. pgvector is enabled by default
3. Copy the connection string to `DATABASE_URL`
4. DocuMind auto-creates all tables on first request

### Step 5 — Deploy
Click **Deploy**. First build ≈ 60 seconds.

After deploy, update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL and **Redeploy**.

---

## 📁 Project Structure

```
documind/
├── app/
│   ├── api/
│   │   ├── analytics/        GET  — aggregated stats
│   │   ├── auth/             POST register / login / logout
│   │   ├── chat/             POST — RAG + SSE streaming
│   │   ├── collections/      GET/POST/PATCH/DELETE
│   │   ├── documents/        GET/DELETE
│   │   ├── export/           GET/POST — CSV / JSON / MD
│   │   ├── health/           GET — deployment health check
│   │   ├── ingest/           POST — upload, chunk, embed
│   │   └── me/               GET — current user + capabilities
│   ├── analytics/            Charts dashboard (Recharts)
│   ├── auth/                 Login + register UI
│   ├── chat/                 Streaming chat with citations
│   ├── collections/          Create / edit / delete / export
│   ├── documents/            Multi-upload / bulk delete / CSV export
│   ├── export/               Download data in CSV / JSON / MD
│   ├── settings/             Capability check + env vars reference
│   ├── error.tsx             Global error boundary
│   ├── loading.tsx           Root loading skeleton
│   ├── not-found.tsx         Custom 404
│   ├── globals.css           Design tokens + utilities
│   ├── layout.tsx            Root layout + Toast provider
│   └── page.tsx              Landing page (12 sections)
├── components/
│   ├── app/
│   │   ├── AuthGate.tsx      Auth redirect wrapper
│   │   ├── Citations.tsx     Score bar + copy + expand
│   │   ├── CollectionPicker  Styled select
│   │   └── Toast.tsx         Global notifications
│   ├── landing/
│   │   └── FAQ.tsx           Animated accordion
│   └── shared/
│       ├── AppSidebar.tsx    6-link sidebar + mobile tabs
│       └── Navigation.tsx    Fixed nav + mobile menu
├── lib/
│   ├── auth.ts               HMAC sessions + bcrypt
│   ├── chunk.ts              1000-char / 150-overlap splitter
│   ├── embeddings.ts         Gemini text-embedding-004 + local fallback
│   ├── llm.ts                Gemini 2.0 Flash SSE streaming
│   ├── mail.ts               Resend welcome emails
│   ├── storage/
│   │   ├── adapter.ts        Interface (updateCollection added)
│   │   ├── index.ts          Auto-selects JSON or Postgres
│   │   ├── json-adapter.ts   Dev: zero-config file store
│   │   └── postgres-adapter  Prod: pgvector vector search
│   ├── store.ts              Facade: getDocuments, updateCollection…
│   ├── types.ts              User, Document, Collection, Citation, ChatMessage
│   ├── use-collections.ts    CRUD hook (create/update/remove)
│   ├── use-user.ts           Session hook
│   └── utils.ts              formatBytes, relativeTime, generateId
├── middleware.ts             Server-side auth protection + expiry check
├── next.config.ts            Next.js 16 TypeScript config
├── vercel.json               Function timeouts + CORS headers
└── .env.example              All variables documented
```

---

## 🔌 API Reference

```http
# Auth
POST /api/auth/register  { name, email, password }
POST /api/auth/login     { email, password }
POST /api/auth/logout

# Collections
GET    /api/collections
POST   /api/collections          { name, description? }
PATCH  /api/collections/:id      { name?, description? }
DELETE /api/collections/:id

# Documents
GET    /api/documents?collectionId=optional
POST   /api/ingest               multipart: file + collectionId
DELETE /api/documents/:id

# Chat (RAG + SSE)
POST   /api/chat    { question, collectionId? }
# Response: line1=JSON{citations}, then streamed text tokens

# Export
GET    /api/export/documents     → .csv
GET    /api/export/collections   → .json
POST   /api/export/chat          { messages, collectionName? } → .md

# System
GET    /api/analytics   → stats, charts data
GET    /api/me          → user + capabilities
GET    /api/health      → deployment health check
```

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.9 + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| AI Chat | Gemini 2.0 Flash (SSE streaming) |
| Embeddings | text-embedding-004 (768-dim) |
| Vector DB | Postgres + pgvector |
| Dev Store | Local JSON file (zero config) |
| Auth | HMAC-SHA256 sessions + bcrypt |
| Charts | Recharts 2 |
| Animations | Framer Motion 12 |
| Email | Resend |

---

## 📄 License

MIT — free to use, modify, and self-host.
