# DocuMind v5

> A self-hosted RAG document intelligence platform. Upload documents, ask questions in plain language, and get grounded, cited answers — powered by your own AI keys.

**Built by [Shaik Muzzammil](https://shaikmuzzammil.vercel.app) · [GitHub](https://github.com/ShaikMuzzammil) · [Portfolio](https://shaikmuzzammil.vercel.app)**

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-format upload** | PDF, TXT, Markdown, CSV, JSON, and 10+ code languages |
| **Semantic RAG chat** | Streaming AI answers with inline source citations |
| **Vector search** | Meaning-based passage retrieval across all documents |
| **Collections** | Organize documents by project, client, or topic |
| **Analytics** | Real-time workspace health and document insights |
| **Export** | CSV, JSON, and Markdown report downloads |
| **Self-hosted** | Your data stays in your own database |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/ShaikMuzzammil/documind.git
cd documind
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — register an account and start uploading documents.

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SECRET` | Signs session cookies (HMAC-SHA256). Must be 32+ random characters. | `openssl rand -hex 32` |

### AI Provider (for chat answers)

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_API_KEY` | API key for your AI provider | — |
| `LLM_BASE_URL` | OpenAI-compatible endpoint | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `LLM_CHAT_MODEL` | Chat model name | `gemini-2.5-flash` |
| `LLM_EMBED_MODEL` | Embedding model name | `gemini-embedding-001` |

**Without `LLM_API_KEY`:** Upload, semantic search, and citation retrieval all work. Only AI-generated answers in Chat are disabled.

### Supported Providers

| Provider | LLM_BASE_URL | Chat Model | Notes |
|----------|-------------|------------|-------|
| **Google Gemini** ⭐ | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` | Free tier available at [aistudio.google.com](https://aistudio.google.com/apikey) |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` | |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` | Fast & free tier |

### Database (production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL + pgvector connection string. Without this, data is stored in `/tmp` and resets on each redeploy. |

**Free PostgreSQL options:** [Neon](https://neon.tech) · [Supabase](https://supabase.com) · [Railway](https://railway.app)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

### Email (optional)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Sends welcome emails on signup ([resend.com](https://resend.com)) |
| `EMAIL_FROM` | Sender address — must be a verified domain in your Resend account |

---

## Minimum Vercel Setup

```env
AUTH_SECRET=<run: openssl rand -hex 32>
LLM_API_KEY=<get free from aistudio.google.com/apikey>
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_CHAT_MODEL=gemini-2.5-flash
DATABASE_URL=<get free from neon.tech>
```

---

## Deploy to Vercel

1. Fork or push this repo to GitHub
2. Connect to Vercel: [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy — the app auto-configures storage based on whether `DATABASE_URL` is set

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL + pgvector (or local JSON fallback)
- **AI:** Any OpenAI-compatible provider (Gemini, OpenAI, Groq)
- **PDF parsing:** pdf-parse v1
- **Charts:** Recharts
- **Auth:** HMAC-SHA256 session cookies + bcrypt passwords

---

## Project Structure

```
app/
  api/           # API routes (all runtime: nodejs)
    auth/        # Login, register, logout
    chat/        # Streaming RAG answers
    ingest/      # Document upload & indexing
    documents/   # Document CRUD
    collections/ # Collection CRUD
    search/      # Semantic search
    stats/       # Analytics data
    me/          # User profile
  chat/          # Chat workspace
  documents/     # Document management
  collections/   # Collection management
  analytics/     # Workspace analytics
  search/        # Semantic search
  export/        # Data export
  settings/      # App settings
  profile/       # User profile
  help/          # Help & guides
lib/
  store.ts       # Storage facade
  storage/       # JSON + Postgres adapters
  embeddings.ts  # Local + remote embeddings
  llm.ts         # Streaming chat client
  chunk.ts       # Text chunking
  auth.ts        # Session management
  analytics.ts   # Stats computation
components/
  shared/        # Navigation, Sidebar, Logo
  app/           # AuthGate, CollectionPicker, Citations
```

---

## Contact & Contributions

- **Portfolio:** [shaikmuzzammil.vercel.app](https://shaikmuzzammil.vercel.app)
- **GitHub:** [@ShaikMuzzammil](https://github.com/ShaikMuzzammil)
- **Issues:** [github.com/ShaikMuzzammil/documind/issues](https://github.com/ShaikMuzzammil/documind/issues)

Bug reports and pull requests are welcome!
