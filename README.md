<div align="center">

# DocuMind v8.1

### Intelligent Document Workspace · RAG Platform · Self-Hostable

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![pgvector](https://img.shields.io/badge/pgvector-0.7-blue?logo=postgresql)](https://github.com/pgvector/pgvector)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

Upload any document. Ask anything. Every answer cited, every source traceable.

[Live Demo](#deploy) · [Quick Start](#quick-start) · [Environment Variables](#environment-variables) · [Architecture](#architecture)

</div>

---

## What is DocuMind?

DocuMind is a production-ready **Retrieval-Augmented Generation (RAG)** platform you can deploy in under 10 minutes. Upload PDFs, Markdown, code, CSV, or any text file — DocuMind chunks and embeds them into a `pgvector` database, then answers questions with inline citations tracing back to the exact source passage.

**Two chat modes:**
- **Document mode** — RAG with cited answers from your files
- **General AI mode** — Full-context multi-turn assistant, no documents needed

---

## Features

| Feature | Details |
|---|---|
| 📄 **12 file formats** | PDF, MD, TXT, CSV, JSON, JS/TS, Python, YAML, SQL, HTML, XML, LOG |
| 🤖 **Any OpenAI-compatible LLM** | Gemini, GPT-4o, Groq/Llama, Ollama, Together, Mistral |
| 🗂️ **Collections** | Namespace docs, scope chat queries per-collection |
| 💬 **Persistent sessions** | Chat history saved to Postgres, rename/browse |
| 🔍 **Semantic search** | Cosine-similarity vector search via pgvector |
| 📊 **Analytics** | Upload velocity, index health, chunk counts, collection breakdown |
| 📤 **Export center** | JSON / CSV / Markdown / JSONL in one click |
| 🔐 **HMAC auth** | Signed session tokens, no OAuth dependency |
| 🌐 **Offline fallback** | Local bag-of-words embedder works without any API key |
| ☁️ **Self-hostable** | Vercel + Neon free tiers, zero vendor lock-in |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/ShaikMuzzammil/documind
cd documind
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see [Environment Variables](#environment-variables)).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### Step 1 — Create a Neon Postgres database

1. Go to [neon.tech](https://neon.tech) → **New project**
2. Copy the **Connection string** (starts with `postgresql://...`)
3. In your Neon dashboard → **Extensions** → search for **vector** → **Enable**

> ⚠️ Enabling the `vector` extension is required. DocuMind will fail to index documents without it.

### Step 2 — Get an AI provider key

DocuMind works with any OpenAI-compatible provider. Recommended free options:

| Provider | Key URL | Model name | Base URL |
|---|---|---|---|
| **Google Gemini** ✅ free | [aistudio.google.com](https://aistudio.google.com/app/apikey) | `gemini-2.5-flash` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | `gpt-4o-mini` | *(leave blank)* |
| Groq | [console.groq.com](https://console.groq.com/keys) | `llama-3.3-70b-versatile` | `https://api.groq.com/openai/v1` |
| Ollama (local) | — | `llama3.2` | `http://localhost:11434/v1` |
| Together AI | [api.together.ai](https://api.together.ai/settings/api-keys) | `meta-llama/Llama-3-70b-chat-hf` | `https://api.together.xyz/v1` |

> **Gemini is recommended** for free-tier users — 15 RPM free, no credit card required.

### Step 3 — Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ShaikMuzzammil/documind)

Or manually:

```bash
npm i -g vercel
vercel --prod
```

### Step 4 — Add environment variables in Vercel

**Vercel Dashboard → Your project → Settings → Environment Variables**

Add all variables from the table below, then **Redeploy**.

---

## Environment Variables

### Required

| Variable | Example | Description |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` output | 32+ char secret for HMAC session signing. **Generate a fresh one — never reuse.** |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Neon (or any Postgres) connection string with pgvector enabled |

### AI Provider (choose one)

| Variable | Example | Description |
|---|---|---|
| `LLM_API_KEY` | `AIza...` | API key for your chosen LLM provider |
| `LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` | OpenAI-compatible base URL. Omit for OpenAI (uses default). |
| `LLM_CHAT_MODEL` | `gemini-2.5-flash` | Chat model name. Default: `gemini-2.5-flash` |
| `LLM_EMBED_MODEL` | `gemini-embedding-001` | Embedding model. Default: `gemini-embedding-001` |
| `EMBED_DIM` | `768` | Embedding dimensions. Must match your model. Default: `768` |

> **Without `LLM_API_KEY`:** Upload, search, and collection features work via local bag-of-words embeddings. AI chat and citations are disabled.

### Optional

| Variable | Example | Description |
|---|---|---|
| `DATABASE_SSL` | `true` | Set to `false` to disable SSL (local Postgres only) |

### `.env.example`

```env
# ── Required ──────────────────────────────────────────────────────────────────
AUTH_SECRET=change-me-generate-with-openssl-rand-base64-32

# ── Database (pgvector required) ──────────────────────────────────────────────
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# ── AI Provider (Gemini example — free tier) ──────────────────────────────────
LLM_API_KEY=AIzaSy...
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_CHAT_MODEL=gemini-2.5-flash
LLM_EMBED_MODEL=gemini-embedding-001
EMBED_DIM=768
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js 16 App                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Landing     │  │  Auth        │  │  App pages    │  │
│  │  (public)    │  │  (HMAC JWT)  │  │  (protected)  │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Routes (Node.js runtime)         │   │
│  │  /api/ingest  /api/chat  /api/search              │   │
│  │  /api/documents  /api/collections  /api/stats     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              lib/ (core logic)                    │   │
│  │  pdf-extract.ts ──► pdfjs-dist (serverless-safe) │   │
│  │  embeddings.ts  ──► OpenAI-compat / local fallback│   │
│  │  llm.ts         ──► streaming SSE                 │   │
│  │  chunk.ts       ──► 512-token paragraph splitter  │   │
│  │  auth.ts        ──► HMAC-SHA256 sessions          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           lib/storage/ (adapter pattern)          │   │
│  │  postgres-adapter.ts  ─── pgvector cosine search  │   │
│  │  json-adapter.ts      ─── in-memory (no DB setup) │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────▼──────────────┐
              │   Neon Postgres + pgvector  │
              │  users · collections        │
              │  documents · chunks (vec)   │
              │  chat_sessions · messages   │
              └───────────────────────────┘
```

### Project structure

```
documind/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── auth/                 # Login & register
│   ├── chat/                 # RAG chat interface
│   ├── documents/            # Upload & manage
│   ├── collections/          # Namespace management
│   ├── analytics/            # Usage dashboard
│   ├── search/               # Semantic search
│   ├── export/               # 4-format data export
│   ├── settings/             # AI engine config
│   ├── help/                 # User guides
│   └── api/                  # All API routes
├── components/
│   ├── shared/
│   │   ├── Navigation.tsx    # Public nav (hidden on app pages)
│   │   └── AppSidebar.tsx    # App sidebar (hidden on public pages)
│   ├── app/
│   │   ├── AuthGate.tsx      # Redirect wrapper for protected pages
│   │   └── CollectionPicker.tsx
│   └── landing/
│       └── FAQ.tsx
├── lib/
│   ├── pdf-extract.ts        # pdfjs-dist PDF parser (serverless-safe)
│   ├── embeddings.ts         # Remote + local embedding fallback
│   ├── llm.ts                # Streaming OpenAI-compatible client
│   ├── chunk.ts              # 512-token paragraph-aware splitter
│   ├── auth.ts               # HMAC-SHA256 sessions
│   ├── store.ts              # Storage facade
│   └── storage/
│       ├── postgres-adapter.ts
│       └── json-adapter.ts
├── proxy.ts                  # Edge runtime route guard
├── next.config.js
└── vercel.json
```

---

## PDF Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `No text layer found` | Scanned (image-only) PDF | Run OCR (Adobe Acrobat, iLovePDF, or `ocrmypdf`) before uploading |
| `Indexing failed: A database error occurred` | pgvector extension missing | Neon dashboard → Extensions → Enable **vector** |
| `Indexing failed: Embedding dimension mismatch` | Changed `EMBED_DIM` or model after upload | Delete old documents and re-upload |
| `Could not connect to the database` | Wrong `DATABASE_URL` | Check string format and SSL settings in Vercel env vars |
| `AI answers not configured` | Missing `LLM_API_KEY` | Add key in Vercel → Settings → Environment Variables → Redeploy |
| Upload stuck on Processing | Large file or timeout | Check Vercel function logs; 15 MB limit per file |

---

## Changing LLM Providers

All configuration is through environment variables — no code changes needed.

### Switch to GPT-4o (OpenAI)

```env
LLM_API_KEY=sk-proj-...
# LLM_BASE_URL is not needed for OpenAI (uses default)
LLM_CHAT_MODEL=gpt-4o-mini
LLM_EMBED_MODEL=text-embedding-3-small
EMBED_DIM=1536
```

> ⚠️ When changing `EMBED_DIM`, delete all existing documents and re-upload. Mixed vector dimensions corrupt search.

### Switch to Groq (Llama — free)

```env
LLM_API_KEY=gsk_...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_CHAT_MODEL=llama-3.3-70b-versatile
# Groq doesn't have embeddings — omit LLM_EMBED_MODEL to use local fallback
```

### Use Ollama (local/private)

```env
LLM_API_KEY=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_CHAT_MODEL=llama3.2
```

> Ollama must be running and the model pulled: `ollama pull llama3.2`

---

## Security Notes

- `AUTH_SECRET` must be a cryptographically random string ≥ 32 characters. Use `openssl rand -base64 32`.
- The Settings page **never** shows API keys, base URLs, or provider names in the UI.
- All provider configuration is server-side only (environment variables).
- Sessions use HMAC-SHA256 signed tokens with 7-day expiry.
- The Edge runtime route guard (`proxy.ts`) verifies the HMAC signature without Node.js dependencies.

---

## Neon Database Setup (detailed)

1. **Create project** at [neon.tech](https://neon.tech) (free tier works)
2. **Enable pgvector**: Neon Dashboard → your project → **Extensions** tab → search `vector` → **Enable**
3. **Copy connection string**: Dashboard → **Connection Details** → copy the `postgresql://...` string
4. **Add SSL**: The connection string from Neon already includes `?sslmode=require`
5. **Set in Vercel**: Project Settings → Environment Variables → `DATABASE_URL` = connection string

DocuMind runs `CREATE EXTENSION IF NOT EXISTS vector` on first boot. If the extension isn't pre-enabled on Neon, this may fail silently — enable it manually from the Neon dashboard.

---

## Local Development Without a Database

If you don't set `DATABASE_URL`, DocuMind falls back to an in-memory JSON store. Data resets on every server restart. Good for testing the UI.

```env
# Minimal .env.local for local testing (no database)
AUTH_SECRET=any-long-random-string-here-32chars
```

---

## Export Formats

| Format | Use case |
|---|---|
| **JSON** | Full metadata, structured import/export |
| **CSV** | Spreadsheet analysis (Excel, Google Sheets) |
| **Markdown** | Human-readable documentation |
| **JSONL** | LLM fine-tuning datasets (OpenAI, Together, Axolotl) |

---

## Built With

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | Full-stack React framework |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [pgvector](https://github.com/pgvector/pgvector) | Vector similarity search |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | Serverless-safe PDF parsing |
| [Neon](https://neon.tech) | Serverless Postgres |
| [Vercel](https://vercel.com) | Deployment platform |
| [Lucide React](https://lucide.dev) | Icons |
| [Recharts](https://recharts.org) | Analytics charts |

---

## License

MIT © Shaik Muzzammil

---

<div align="center">

Made with ♥ by [ShaikMuzzammil](https://shaikmuzzammil.vercel.app)

</div>
