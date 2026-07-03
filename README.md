<div align="center">

# DocuMind

**Turn any document into an expert you can question.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![pgvector](https://img.shields.io/badge/pgvector-HNSW-336791?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com)

</div>

---

## What it does

Upload PDFs, research papers, contracts, code, or any text document. Ask questions in plain language. Get concise answers **grounded in your own files** — every claim is backed by a citation link to the exact passage.

No hallucinations. No shared server. Your data stays in your own database.

---

## Feature overview

| Area | What's included |
|------|----------------|
| **Document ingestion** | PDF (pdf-parse v2), Markdown, plain text, CSV, JSON, most code file types |
| **Retrieval** | 768-dim semantic vectors, HNSW cosine index, overlap-aware chunking |
| **Chat** | Streaming SSE responses, collection-scoped queries, citation expansion |
| **Search** | Dedicated semantic search page with per-passage confidence scores |
| **Collections** | Group documents into project workspaces; chat stays scoped |
| **Analytics** | Recharts dashboard — docs/chunks per collection, file-type breakdown, capability status |
| **Profile** | Editable display name, monthly upload chart, top collections |
| **Settings** | Profile, Workspace info, Notifications, Privacy — zero credential exposure |
| **Export** | CSV (documents) and JSON (collections) with one click |
| **Help** | Step-by-step guides + troubleshooting accordion |
| **Auth** | HMAC-signed session cookies, per-user data isolation, no back-navigation to login once signed in |
| **Storage** | Auto-selects Postgres+pgvector when `DATABASE_URL` is set, falls back to local JSON |
| **Fallback embeddings** | Works without an AI key — uses deterministic local hashing so the full pipeline runs with zero setup |

---

## Quick start (local)

```bash
git clone https://github.com/your-username/documind
cd documind
npm install
cp .env.example .env.local
# → Fill in AUTH_SECRET and LLM_API_KEY at minimum
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, upload a document.

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://your-app.vercel.app` |
| `LLM_API_KEY` | ✅ | Gemini key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `DATABASE_URL` | Recommended | Postgres + pgvector (free tier: [neon.tech](https://neon.tech)) |
| `RESEND_API_KEY` | Optional | For welcome emails ([resend.com](https://resend.com)) |
| `EMAIL_FROM` | Optional | e.g. `DocuMind <hello@yourdomain.com>` |

4. Click **Deploy** — build completes in under 90 seconds.

---

## Architecture

```
Browser
  │
  ├── /                  Landing page (Next.js RSC)
  ├── /auth              Login / Register (client, HMAC cookie session)
  │
  └── /chat              Streaming chat   ──┐
  └── /documents         Upload + list    ──┤
  └── /collections       Workspaces       ──┤──► API Routes (Edge-compatible)
  └── /search            Semantic search  ──┤         │
  └── /analytics         Charts + status  ──┤    ┌────▼────────┐
  └── /profile           Account + stats  ──┤    │  lib/store  │
  └── /settings          Preferences      ──┤    │  (adapter)  │
  └── /export            CSV / JSON       ──┤    └─────┬───────┘
  └── /help              Guides           ──┘          │
                                                  ┌────▼────────────────┐
                                                  │  Postgres + pgvector │
                                                  │  (or JSON file store)│
                                                  └──────────────────────┘
                                                          │
                                                  ┌───────▼──────────────┐
                                                  │  Embedding provider   │
                                                  │  (Gemini / fallback)  │
                                                  └──────────────────────┘
```

---

## Retrieval pipeline

```
User question
     │
     ▼
embedOne(question)          → 768-dim query vector
     │
     ▼
search(queryVec, {topK:5})  → cosine similarity against chunk vectors
     │                         (HNSW in Postgres; linear in JSON store)
     ▼
buildMessages(question, citations) → system + user prompt with context passages
     │
     ▼
streamChat(messages)        → token-by-token SSE stream
     │
     ▼
Citations component         → expandable source passages with confidence %
```

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET`  | `/api/me` | Current user + capability flags |
| `PATCH`| `/api/me` | Update display name |
| `GET`  | `/api/collections` | List workspaces |
| `POST` | `/api/collections` | Create workspace |
| `DELETE`| `/api/collections/[id]` | Delete workspace + all its data |
| `GET`  | `/api/documents` | List documents (filterable by collectionId) |
| `DELETE`| `/api/documents/[id]` | Delete document + its chunks |
| `POST` | `/api/ingest` | Upload and index a file |
| `POST` | `/api/chat` | Streaming SSE chat completion |
| `POST` | `/api/search` | Semantic passage search |
| `GET`  | `/api/stats` | Workspace stats + capability flags |

---

## Development notes

- **TypeScript strict mode** — all files pass `tsc --noEmit` with zero errors.
- **ESLint** — `next/core-web-vitals` + `next/typescript` rules, no suppressions.
- **No secrets in source** — API keys, DB URL, and auth secrets are env-only; the Settings page shows no credentials.
- **Serverless-safe writes** — JSON file writes catch `EROFS` and return a helpful error instead of crashing silently.
- **Dimension-safe embeddings** — if the provider returns a different vector width, it is sliced/padded to `EMBED_DIM` so storage never breaks.

---

## GitHub repo info

> 🧠 Upload any document, ask anything — source-cited answers grounded in your own files | Next.js 16 · RAG · pgvector · Gemini · TypeScript

**Topics:** `nextjs` `typescript` `rag` `document-intelligence` `pgvector` `postgresql` `tailwindcss` `semantic-search` `document-chat` `vercel` `gemini-ai` `pii-detection` `schema-extraction`

---

## Roadmap

- [ ] Multi-file drag-and-drop with progress bars
- [ ] Collection sharing (invite by email)
- [ ] Chat history persistence across sessions
- [ ] Schema-driven batch extraction (CSV output from multiple docs)
- [ ] PII detection and redaction before indexing

---

<div align="center">
  Built with Next.js 16 · Tailwind v4 · pgvector · Gemini
</div>
