# DocuMind v3 — Document Intelligence Platform

> Upload documents. Ask questions. Get grounded, cited answers from your own data.

---

## Overview

DocuMind is a production-grade **Retrieval-Augmented Generation (RAG)** platform built with Next.js 15. It lets users upload documents, index them using high-dimensional semantic embeddings, and query them through a streaming AI chat interface with full source citations.

Every answer is grounded in your actual documents — not general knowledge. No hallucinations. Every claim links to its exact source chunk with a confidence score.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DocuMind v3 Pipeline                      │
├──────────┬──────────┬───────────┬──────────┬────────────────┤
│  Ingest  │  Chunk   │   Embed   │  Index   │  Query/Answer  │
│  PDF/TXT │ Semantic │ 768-dim   │ pgvector │  LLM + SSE     │
│  MD/CSV  │ boundary │ embedding │ cosine   │  streaming     │
│  JSON/TS │ detect   │ model     │ IVFFlat  │  + citations   │
└──────────┴──────────┴───────────┴──────────┴────────────────┘
```

**Stack:**
- **Framework:** Next.js 15.3.4 (App Router, Server Components)
- **AI Layer:** Streaming REST calls to AI generation + embedding models
- **Vector Store:** PostgreSQL + pgvector (or local JSON fallback)
- **Auth:** HMAC-signed session cookies (no external OAuth)
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Charts:** Recharts
- **Animations:** Framer Motion

---

## Features

| Area | Capability |
|------|-----------|
| **Documents** | PDF, TXT, MD, CSV, JSON, TS/JS/PY — multi-file drag-drop with live progress |
| **Indexing** | Semantic chunking → 768-dim embedding → vector search |
| **Chat** | Streaming responses, per-message citations with confidence bars, export to Markdown |
| **Collections** | Organize documents into isolated workspaces |
| **Analytics** | Document health, type breakdown, per-collection stats, recent activity |
| **Export** | CSV (documents), JSON (collections), Markdown (chat), Schema CSV/JSON |
| **Schema Extraction** | Define JSON schema → AI extracts structured fields from entire collections |
| **Settings** | Profile management, AI preferences, notification settings, privacy controls |
| **Auth** | Secure session cookies, clear error messages, password visibility toggle |

---

## Quick Start

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
AI_API_KEY=your_ai_api_key_here
AUTH_SECRET=your_random_32_char_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. (Optional) Add a database

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_SSL=true
```

If `DATABASE_URL` is not set, DocuMind automatically uses a local JSON store (`.data/` directory) — perfect for development and demos.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_API_KEY` | AI API key (Gemini, OpenAI-compatible) | ✅ For AI features |
| `AUTH_SECRET` | HMAC secret for session cookies — run `openssl rand -base64 32` | ✅ |
| `NEXT_PUBLIC_APP_URL` | Deployment URL without trailing slash | ✅ |
| `DATABASE_URL` | PostgreSQL connection string with pgvector | Optional |
| `DATABASE_SSL` | Set `false` for local dev without SSL | Optional |
| `AI_CHAT_MODEL` | Override chat model (default: `gemini-2.0-flash`) | Optional |
| `AI_EMBED_MODEL` | Override embedding model (default: `text-embedding-004`) | Optional |
| `RESEND_API_KEY` | For welcome emails via Resend | Optional |
| `EMAIL_FROM` | Sender address, e.g. `DocuMind <noreply@yourdomain.com>` | Optional |

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "init: DocuMind v3"
git remote add origin https://github.com/YOUR_USERNAME/documind.git
git push -u origin main
```

### 2. Import on Vercel

[vercel.com/new](https://vercel.com/new) → Import repo → Framework auto-detected as **Next.js**.

### 3. Build settings (all defaults — nothing to change)

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Node.js | 20.x |

### 4. Environment Variables

Add in **Project Settings → Environment Variables**:

```
AI_API_KEY          = <your key>
AUTH_SECRET         = <openssl rand -base64 32>
NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
DATABASE_URL        = <neon or supabase connection string>
DATABASE_SSL        = true
```

### 5. Free Database (Neon recommended)

1. Go to [neon.tech](https://neon.tech) → Create project
2. Copy the connection string (format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
3. Paste as `DATABASE_URL` in Vercel
4. pgvector is pre-enabled on Neon — no setup needed
5. DocuMind auto-creates all tables on first request

### 6. Deploy

Click **Deploy**. First build ~60s.

### 7. Update APP_URL

After deployment, update `NEXT_PUBLIC_APP_URL` to your live URL and redeploy.

---

## Project Structure

```
documind/
├── app/
│   ├── page.tsx              # Landing page (9 sections, no external links)
│   ├── layout.tsx            # Root layout with Navigation + Sidebar + Toast
│   ├── globals.css           # Design tokens (midnight navy + blue + emerald)
│   ├── auth/page.tsx         # Sign in / Register with clear error messages
│   ├── chat/page.tsx         # Streaming chat with citations
│   ├── documents/page.tsx    # Multi-file upload with drag-drop + progress
│   ├── collections/page.tsx  # Collection management with inline edit
│   ├── analytics/page.tsx    # Recharts dashboard
│   ├── export/page.tsx       # Bulk export + schema-driven AI extraction
│   ├── settings/page.tsx     # Profile, AI prefs, notifications, privacy
│   └── api/
│       ├── me/route.ts       # GET + PATCH user profile
│       ├── auth/             # login, register, logout
│       ├── chat/route.ts     # Streaming RAG chat
│       ├── ingest/route.ts   # Document upload + chunking + embedding
│       ├── documents/        # GET, DELETE
│       ├── collections/      # GET, POST, PATCH, DELETE
│       ├── analytics/        # Aggregated workspace stats
│       ├── export/           # CSV, JSON, Markdown exports
│       ├── schema-extract/   # AI batch field extraction
│       └── health/           # Uptime endpoint
├── components/
│   ├── shared/
│   │   ├── Navigation.tsx    # Sticky nav with section scroll-highlighting
│   │   └── AppSidebar.tsx    # App sidebar with user display + logout
│   └── app/
│       ├── AuthGate.tsx      # Client-side auth guard
│       ├── Citations.tsx     # Expandable citations with confidence bars
│       ├── CollectionPicker.tsx
│       └── Toast.tsx         # Global notification system
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── utils.ts              # formatBytes, generateId, cosineSim
│   ├── auth.ts               # HMAC sessions, hashPassword
│   ├── store.ts              # Unified adapter (Postgres or JSON)
│   ├── db-json.ts            # Local JSON file store
│   ├── db-postgres.ts        # PostgreSQL + pgvector adapter
│   ├── llm.ts                # Streaming AI with quota error handling
│   ├── embeddings.ts         # Batch embedding with hash fallback
│   ├── chunk.ts              # Semantic text chunker
│   ├── use-user.ts           # React hook for current user
│   └── use-collections.ts    # React hook for collections
├── middleware.ts             # Server-side auth guard
├── vercel.json               # 60s timeout + CORS headers
├── next.config.ts
├── tsconfig.json
└── .env.example
```

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/me` | Current user info |
| `PATCH` | `/api/me` | Update name / password |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `POST` | `/api/ingest` | Upload + index document |
| `POST` | `/api/chat` | Streaming RAG chat |
| `GET` | `/api/documents` | List documents (filter by collectionId) |
| `DELETE` | `/api/documents/:id` | Delete document + chunks |
| `GET` | `/api/collections` | List collections |
| `POST` | `/api/collections` | Create collection |
| `PATCH` | `/api/collections/:id` | Update name/description |
| `DELETE` | `/api/collections/:id` | Delete collection |
| `GET` | `/api/analytics` | Workspace stats |
| `GET` | `/api/export/documents` | CSV export |
| `GET` | `/api/export/collections` | JSON export |
| `POST` | `/api/export/chat` | Markdown chat export |
| `POST` | `/api/schema-extract` | AI batch field extraction |
| `GET` | `/api/health` | Uptime check |

---

## Key Design Decisions

**Why local JSON fallback?**
DocuMind is fully functional without any database — useful for demos, local development, and deployments where setting up pgvector is overhead. The adapter pattern in `lib/store.ts` makes the database swap transparent.

**Why HMAC cookies instead of JWT / NextAuth?**
Zero dependencies, deterministic, fast. HMAC-SHA256 with a strong secret provides the same security guarantees as JWT for session management at a fraction of the code complexity.

**Why streaming chat?**
Server-Sent Events allow the first token to appear in under 1 second, giving immediate visual feedback that the system is working — critical UX for AI interfaces.

**AI Quota Handling**
When the free tier quota is exceeded, the system returns a user-friendly message instead of a raw API error object. This was a key fix from v2 where raw JSON error payloads were displayed to users.

---

## Roadmap

- [ ] GraphRAG — cross-document entity relationship extraction
- [ ] Layout-aware PDF parsing (table + chart extraction)
- [ ] Bounding-box PDF citations (click to jump to page)
- [ ] PII auto-redaction before AI processing
- [ ] Webhook on document processing completion
- [ ] Team workspaces with RBAC

---

## License

MIT — modify and deploy freely.
