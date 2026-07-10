# DocuMind v7.0

> **Your documents, intelligently answered.**  
> A production-ready, self-hosted RAG (Retrieval-Augmented Generation) platform built with Next.js 16, pgvector, and any OpenAI-compatible LLM.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FShaikMuzzammil%2Fdocumind)

---

## Features

| Feature | Description |
|---|---|
| **RAG pipeline** | Upload → chunk → embed → pgvector, ready in seconds |
| **Cited answers** | Every AI response traces back to exact source chunks |
| **General AI mode** | Toggle between doc-grounded answers and free-form AI chat |
| **Persistent sessions** | Chat history saved per-user with rename/delete |
| **Semantic search** | Vector cosine similarity — finds meaning, not just keywords |
| **Collections** | Namespace documents, scope queries per-project |
| **Analytics dashboard** | Upload velocity, index health, per-collection stats |
| **Export center** | JSON · CSV · Markdown · JSONL (LLM fine-tuning ready) |
| **Chunk preview modal** | Browse every text chunk extracted from any document |
| **OpenAI-compatible** | Gemini, OpenAI, Groq, Ollama, Together — plug-in any provider |
| **Self-hostable** | Vercel + Neon, zero vendor lock-in, MIT licensed |

---

## Quick Start (Vercel + Neon)

### 1. Fork & clone

```bash
git clone https://github.com/ShaikMuzzammil/documind.git
cd documind
npm install
```

### 2. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) (free tier works fine)
2. Create a new project → copy the **connection string** (starts with `postgresql://`)
3. In the Neon SQL Editor, run:

```sql
-- Required for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it worked
SELECT * FROM pg_extension WHERE extname = 'vector';
```

> **If uploads fail with "database error"** — this extension step is the most common missing piece. Do it first.

### 3. Set environment variables

Create `.env.local` for local dev (never commit this file):

```env
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_SECRET=your-random-32-char-secret     # generate: openssl rand -hex 32

# ── AI / LLM ─────────────────────────────────────────────────────────────────
# Option A — Google Gemini (free tier, recommended for new users)
LLM_API_KEY=AIza...
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_CHAT_MODEL=gemini-2.5-flash

# Option B — OpenAI
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_CHAT_MODEL=gpt-4o-mini

# Option C — Groq (fast inference, generous free tier)
LLM_API_KEY=gsk_...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_CHAT_MODEL=llama-3.3-70b-versatile

# Option D — Ollama (local, no cost)
LLM_API_KEY=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_CHAT_MODEL=llama3.2

# ── Embeddings ────────────────────────────────────────────────────────────────
# Uses the same provider as above by default (text-embedding-3-small or equivalent)
EMBEDDING_API_KEY=      # leave blank to reuse LLM_API_KEY
EMBEDDING_BASE_URL=     # leave blank to reuse LLM_BASE_URL
EMBEDDING_MODEL=text-embedding-3-small

# ── Optional: Email (Resend — for future email features) ──────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Then in **Vercel → Your Project → Settings → Environment Variables**, add all variables from `.env.local`.

> After adding env vars, always **redeploy** so they take effect.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon (or any Postgres) connection string with `?sslmode=require` |
| `AUTH_SECRET` | ✅ | 32-char random secret for session signing (`openssl rand -hex 32`) |
| `LLM_API_KEY` | ✅ | API key for your chosen LLM provider |
| `LLM_BASE_URL` | ✅ | Base URL of OpenAI-compatible API (see examples above) |
| `LLM_CHAT_MODEL` | ✅ | Model name for chat completions |
| `EMBEDDING_API_KEY` | ☐ | Defaults to `LLM_API_KEY` if blank |
| `EMBEDDING_BASE_URL` | ☐ | Defaults to `LLM_BASE_URL` if blank |
| `EMBEDDING_MODEL` | ☐ | Defaults to `text-embedding-3-small` |
| `RESEND_API_KEY` | ☐ | For transactional email (optional) |
| `EMAIL_FROM` | ☐ | Sender address for emails (optional) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Next.js 16                            │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  /app/chat  │   │ /app/docs    │   │ /app/analytics   │  │
│  │  (RAG + AI) │   │ (upload UI)  │   │ (insights)       │  │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────┘  │
│         │                 │                                   │
│  ┌──────▼─────────────────▼──────────────────────────────┐   │
│  │              API Routes (Node.js runtime)              │   │
│  │  /api/chat   /api/ingest   /api/search   /api/export  │   │
│  └──────┬───────────────────────────────────────────────┘   │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────────┐ │
│  │  lib/                                                    │ │
│  │  ├── embeddings.ts  → OpenAI-compatible embed API       │ │
│  │  ├── llm.ts         → streamChat + buildGeneralMessages │ │
│  │  ├── store.ts       → Postgres / pgvector queries       │ │
│  │  ├── chunk.ts       → recursive text chunker            │ │
│  │  └── auth.ts        → HMAC session auth                 │ │
│  └──────┬───────────────────────────────────────────────────┘ │
└─────────┼────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────┐
│  Neon (Postgres + pgvector)│
│  ├── documents            │
│  ├── chunks (vector)      │
│  ├── chat_sessions        │
│  ├── chat_messages        │
│  └── collections          │
└────────────────────────────┘
```

---

## PDF Upload Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Indexing failed: A database error occurred` | `pgvector` extension not enabled | Run `CREATE EXTENSION IF NOT EXISTS vector;` in Neon SQL Editor |
| `Failed to load external module pdf-parse-…` | Vercel bundling issue (v6 and earlier) | **Fixed in v7** — webpack alias routes pdf-parse to its lib file |
| `Could not read this PDF … scanned` | PDF is image-only (no text layer) | Run OCR first: Adobe Acrobat, `ocrmypdf`, or Google Drive |
| `No text layer found` | Same as above | Same fix |
| `File too large` | > 15 MB | Split the PDF or compress before uploading |

---

## Chat Modes

**Document Mode** (default)  
Queries are embedded and matched against your indexed chunks via cosine similarity. Answers cite the exact passages used. If no chunks are found, the AI says so rather than guessing.

**General AI Mode**  
No document search — direct LLM conversation with full turn-by-turn history. Great for coding help, writing, analysis, or anything not in your documents. Toggle using the pill in the chat header.

---

## Adding a New LLM Provider

`LLM_BASE_URL` accepts any OpenAI-compatible endpoint. Examples:

```env
# Anthropic (via openai-compatible proxy)
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_CHAT_MODEL=claude-3-5-haiku-20241022

# Together AI
LLM_BASE_URL=https://api.together.xyz/v1
LLM_CHAT_MODEL=meta-llama/Llama-3-8b-chat-hf

# Local Ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_CHAT_MODEL=llama3.2
LLM_API_KEY=ollama   # any non-empty string
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Neon Postgres + `pgvector` extension |
| Auth | Custom HMAC sessions (`bcryptjs`) |
| AI / LLM | Any OpenAI-compatible REST API |
| Embeddings | `text-embedding-3-small` (or equivalent) |
| PDF parsing | `pdf-parse` (webpack-aliased to lib entry) |
| Styling | Tailwind CSS v4 + CSS variables |
| Deployment | Vercel (Edge-compatible pages, Node.js API routes) |

---

## Project Structure

```
documind/
├── app/
│   ├── page.tsx              # Landing page (no duplicate nav)
│   ├── auth/page.tsx         # Login / signup
│   ├── chat/page.tsx         # Chat with mode toggle
│   ├── documents/page.tsx    # Upload & manage docs
│   ├── collections/page.tsx  # Collection management
│   ├── analytics/page.tsx    # Usage analytics
│   ├── search/page.tsx       # Semantic search
│   ├── export/page.tsx       # Data export
│   ├── help/page.tsx         # Help & guides
│   ├── settings/page.tsx     # AI & account config
│   └── api/
│       ├── chat/route.ts         # Streaming chat (RAG + general)
│       ├── chat/sessions/        # Session CRUD
│       ├── ingest/route.ts       # File upload + embedding
│       ├── documents/route.ts    # Document list
│       ├── documents/[id]/       # Single doc ops + preview
│       ├── search/route.ts       # Semantic search
│       ├── export/route.ts       # Data export
│       └── auth/                 # Login / logout / me
├── components/
│   ├── shared/
│   │   ├── AppSidebar.tsx    # Collapsible nav (fixed collapse button)
│   │   └── Navigation.tsx    # Landing page nav
│   ├── app/
│   │   ├── AuthGate.tsx      # Route protection
│   │   └── CollectionPicker.tsx
│   └── landing/
│       └── FAQ.tsx
├── lib/
│   ├── llm.ts            # buildMessages + buildGeneralMessages + streamChat
│   ├── embeddings.ts     # embed() + embedOne()
│   ├── store.ts          # All DB queries
│   ├── chunk.ts          # Text chunking
│   ├── auth.ts           # Session auth
│   └── types.ts          # Shared TypeScript types
└── next.config.js        # pdf-parse alias fix, security headers
```

---

## License

MIT — see [LICENSE](LICENSE).

Built by [ShaikMuzzammil](https://github.com/ShaikMuzzammil) · Deployed at [documind-iota-lyart.vercel.app](https://documind-iota-lyart.vercel.app)
