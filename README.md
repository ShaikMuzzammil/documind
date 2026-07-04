<div align="center">

# DocuMind

**RAG-powered document intelligence — self-hosted & private**

Upload PDFs, notes, and code · Ask questions in plain language · Get cited answers from your own files

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://typescriptlang.org)
[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Tech stack](#tech-stack)
3. [Quick start (local)](#quick-start-local)
4. [Configuration — environment variables](#configuration--environment-variables)
   - [Required variables](#required-variables)
   - [AI / LLM provider](#ai--llm-provider)
   - [Supported providers](#supported-providers)
   - [Database (optional, recommended for production)](#database-optional-recommended-for-production)
   - [Email (optional)](#email-optional)
5. [Deploy to Vercel](#deploy-to-vercel)
6. [How RAG works in DocuMind](#how-rag-works-in-documind)
7. [File types supported](#file-types-supported)
8. [Project structure](#project-structure)
9. [FAQ](#faq)

---

## What it does

DocuMind is a self-hosted workspace that lets you:

- **Upload** documents (PDF, Markdown, CSV, JSON, code files)
- **Index** them automatically — text is extracted, split into ~512-token chunks, and embedded as vectors
- **Chat** with your documents — ask anything in plain language and receive AI answers grounded in your files, with citations pointing to the exact source passages
- **Search** semantically — find relevant passages across all documents by meaning, not just keywords
- **Organize** with Collections — group related documents and scope chat retrieval to a single collection
- **Export** your data — download documents and collections as CSV, JSON, or Markdown

All data stays in **your** database. AI answers are generated using **your** API key. Nothing is shared with DocuMind servers.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | Custom HMAC-signed sessions (Web Crypto API) |
| Passwords | bcryptjs |
| Vectors | pgvector (PostgreSQL) or local JSON fallback |
| AI / LLM | Any OpenAI-compatible API |
| Email | Resend (optional) |
| Deployment | Vercel (recommended) |

---

## Quick start (local)

```bash
# 1 — Clone
git clone https://github.com/ShaikMuzzammil/documind.git
cd documind

# 2 — Install dependencies
npm install

# 3 — Create your environment file
cp .env.example .env.local
# Edit .env.local — see the Configuration section below

# 4 — Run in development
npm run dev
```

Open http://localhost:3000, register an account, and upload your first document.

---

## Configuration — environment variables

Copy `.env.example` to `.env.local` for local development, or set these in your Vercel project's **Settings → Environment Variables** for production.

### Required variables

| Variable | Description | Example |
|---|---|---|
| `AUTH_SECRET` | Random 32-character secret for signing session tokens. **Change this before deploying.** | `openssl rand -hex 32` |

```bash
AUTH_SECRET=your-random-32-char-secret-here
```

### AI / LLM provider

DocuMind uses any **OpenAI-compatible** API. Set these three variables:

| Variable | Description |
|---|---|
| `LLM_API_KEY` | Your API key from the provider |
| `LLM_BASE_URL` | The provider's OpenAI-compatible base URL |
| `LLM_CHAT_MODEL` | The model name to use for chat completions |

> **Without `LLM_API_KEY`** — document upload, indexing, semantic search, and citation retrieval all work. Only AI-generated answers in Chat are disabled.

### Supported providers

#### Google Gemini *(recommended — free tier available)*

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create an API key (no credit card needed)
3. Set these variables:

```env
LLM_API_KEY=AIza...your_gemini_key
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_CHAT_MODEL=gemini-2.5-flash
```

#### OpenAI

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create an API key
3. Set these variables:

```env
LLM_API_KEY=sk-...your_openai_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_CHAT_MODEL=gpt-4o-mini
```

#### Groq *(free tier — ultra-fast inference)*

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create an API key (no credit card needed)
3. Set these variables:

```env
LLM_API_KEY=gsk_...your_groq_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_CHAT_MODEL=llama-3.1-70b-versatile
```

#### Any other OpenAI-compatible provider

Set `LLM_BASE_URL` to the provider's base URL (ending before `/chat/completions`), `LLM_API_KEY` to your key, and `LLM_CHAT_MODEL` to the model name. Examples: OpenRouter, Together AI, Mistral AI, local Ollama, etc.

---

### Database (optional, recommended for production)

By default DocuMind stores everything in a local JSON file (`/tmp/documind-store.json`). This is fine for development and demos but **will reset on Vercel deployments**.

For production, use **PostgreSQL with pgvector**:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**Recommended providers:** [Neon](https://neon.tech) (free tier), [Supabase](https://supabase.com) (free tier), [Railway](https://railway.app), or any PostgreSQL host.

The pgvector extension must be enabled on your database. Most managed providers have it available:

```sql
-- Run once on your database
CREATE EXTENSION IF NOT EXISTS vector;
```

DocuMind will automatically create the required tables on first run when `DATABASE_URL` is set.

---

### Email (optional)

Sends a welcome email when a user registers. Requires a free [Resend](https://resend.com) account.

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `EMAIL_FROM` | The sender address (must be a verified domain in Resend) |

```env
RESEND_API_KEY=re_...your_resend_key
EMAIL_FROM=noreply@yourdomain.com
```

---

### Complete `.env.example`

```env
# ── Required ──────────────────────────────────────────────────────────
AUTH_SECRET=change-this-to-a-random-32-char-secret

# ── AI / LLM (choose one provider) ───────────────────────────────────
# Google Gemini (recommended, free tier)
LLM_API_KEY=
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_CHAT_MODEL=gemini-2.5-flash

# ── Database (optional, recommended for production) ───────────────────
DATABASE_URL=

# ── Email (optional) ──────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=
```

---

## Deploy to Vercel

1. **Fork** or push this repository to your GitHub account
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. In **Environment Variables**, add at minimum:
   - `AUTH_SECRET` — a random 32-character string
   - `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_CHAT_MODEL` — from your chosen provider
   - `DATABASE_URL` — a PostgreSQL connection string (for persistent storage)
4. Click **Deploy**

After adding or changing environment variables in Vercel, go to **Deployments → ⋯ → Redeploy** for the changes to take effect. The AI status indicator in the sidebar will update automatically.

---

## How RAG works in DocuMind

**Retrieval-Augmented Generation (RAG)** is a technique that grounds AI answers in your documents:

1. **Upload** — a document is uploaded and its text is extracted
2. **Chunk** — the text is split into ~512-token segments with paragraph-aware splitting
3. **Embed** — each chunk is converted to a vector representation (embedding) that captures its semantic meaning
4. **Store** — chunks and vectors are stored in PostgreSQL + pgvector (or local JSON)
5. **Query** — when you ask a question, it is also embedded and compared against all stored chunk vectors using cosine similarity
6. **Retrieve** — the top-k most similar chunks are returned as context
7. **Generate** — only those retrieved chunks (not full documents) are sent to the AI provider along with your question
8. **Answer** — the AI generates a grounded answer referencing the provided passages, which DocuMind surfaces as inline citations

This means answers are factually grounded in your documents, full documents are never sent to the AI, and the system works even with very large document collections.

---

## File types supported

| Type | Extension |
|---|---|
| PDF | `.pdf` |
| Plain text | `.txt` |
| Markdown | `.md` |
| CSV | `.csv` |
| JSON | `.json` |
| JavaScript | `.js`, `.jsx`, `.mjs` |
| TypeScript | `.ts`, `.tsx` |
| Python | `.py` |
| Rust | `.rs` |
| Go | `.go` |
| Shell | `.sh`, `.bash` |

> **Note:** Scanned PDFs without a text layer (image-only PDFs) are not supported. Only PDFs with embedded text content can be indexed.

---

## Project structure

```
documind/
├── app/
│   ├── api/                  # API routes (auth, documents, chat, search, etc.)
│   ├── auth/                 # Sign in / register page
│   ├── chat/                 # Chat workspace
│   ├── collections/          # Collection management
│   ├── documents/            # Document upload and management
│   ├── analytics/            # Workspace analytics
│   ├── search/               # Semantic search
│   ├── settings/             # Account settings
│   ├── export/               # Data export
│   ├── help/                 # Guides and documentation
│   ├── profile/              # User profile
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── app/                  # Application components (AuthGate, CollectionPicker, etc.)
│   └── shared/               # Shared components (Navigation, AppSidebar, Logo)
├── lib/
│   ├── storage/              # Storage adapters (PostgreSQL + pgvector / JSON fallback)
│   ├── auth.ts               # Session management (HMAC-SHA256, bcrypt)
│   ├── llm.ts                # LLM client (OpenAI-compatible)
│   ├── embeddings.ts         # Embedding generation
│   ├── chunk.ts              # Document chunking
│   ├── analytics.ts          # Workspace statistics
│   ├── types.ts              # Shared TypeScript types
│   └── utils.ts              # Utility functions
├── proxy.ts                  # Next.js 16 Edge route guard (replaces middleware.ts)
├── README.md                 # This file
└── .env.example              # Environment variable template
```

---

## FAQ

**Why does chat say "AI answers not turned on"?**
You need to set `LLM_API_KEY` in your environment variables. See the [AI / LLM provider](#ai--llm-provider) section above. Google Gemini has a free tier that requires no credit card.

**Data resets every deployment on Vercel — how do I fix it?**
Set `DATABASE_URL` to a PostgreSQL connection string. Without it, data is stored in `/tmp` which is cleared on each Vercel deployment. Neon and Supabase both have free PostgreSQL tiers with pgvector support.

**Can I run this locally without any cloud services?**
Yes. Run `npm run dev` without any environment variables set. You get local JSON storage, no email, and no AI answers — but uploads, indexing, and semantic search all work.

**Is this secure enough for sensitive documents?**
DocuMind is designed for self-hosted use where you control the infrastructure. Session tokens are HMAC-signed, passwords are bcrypt-hashed, and data is isolated per user. For highly sensitive data, review the full codebase and deploy on infrastructure you own and trust.

**Can I add my own AI model?**
Yes. Any provider that exposes an OpenAI-compatible `/chat/completions` endpoint works. Set `LLM_BASE_URL` to that endpoint and `LLM_CHAT_MODEL` to the model name.

---

<div align="center">
Built with Next.js · TypeScript · pgvector · Tailwind CSS
</div>
