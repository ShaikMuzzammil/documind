<div align="center">

# 🧠 DocuMind

### AI Document Intelligence — Powered by Google Gemini

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Upload documents. Ask questions. Get cited, grounded answers — powered by Gemini AI.**

[Live Demo](#) · [Quick Start](#quick-start) · [Deploy](#deployment) · [API Docs](#api-routes)

</div>

---

## ✨ What is DocuMind?

DocuMind is a **Retrieval-Augmented Generation (RAG)** workspace that turns your PDFs, notes, and code files into a searchable AI knowledge base.

- 📄 **Upload** PDFs, Markdown, text, CSV, JSON, and code files
- 🔍 **Retrieve** relevant passages via 768-dimensional semantic vector search
- 🤖 **Ask** questions in natural language
- 💬 **Get** concise, structured answers with **inline citations**
- 🛡️ **Trust** that if the answer isn't in your documents, DocuMind says so

Powered by **Gemini 2.0 Flash** for reasoning and **text-embedding-004** for embeddings.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         DocuMind RAG Pipeline                     │
├──────────────────┬───────────────────────┬───────────────────────┤
│   INGESTION       │   RETRIEVAL            │   GENERATION          │
│                  │                       │                       │
│  File Upload     │  Embed query           │  Build system prompt  │
│  ↓               │  (text-embedding-004)  │  + context passages   │
│  Text Extraction │  ↓                    │  ↓                    │
│  (pdf-parse)     │  Cosine similarity     │  Gemini 2.0 Flash     │
│  ↓               │  (pgvector <=>)        │  (streaming SSE)      │
│  chunkText()     │  ↓                    │  ↓                    │
│  1000-char chunks│  Top-5 passages        │  Token-by-token       │
│  150-char overlap│  by user+collection    │  streaming response   │
│  ↓               │                       │  ↓                    │
│  Batch embed     │                       │  Inline citations [1] │
│  Store vectors   │                       │  Source panel w/scores│
└──────────────────┴───────────────────────┴───────────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                    ┌─────────────────────────┐
│   JSON Store     │ (dev, zero setup)  │   Postgres + pgvector   │ (prod)
│   ./data/*.json  │                    │   DATABASE_URL env var  │
└─────────────────┘                    └─────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free)
- (Optional) Postgres with pgvector for production

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
# Required for AI features
GEMINI_API_KEY=your_key_here

# Required in production
AUTH_SECRET=$(openssl rand -base64 32)

# Optional: Postgres + pgvector (leave empty to use local JSON store)
DATABASE_URL=postgresql://user:password@host:5432/documind

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account.

---

## 🌍 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | **Yes** (for AI) | Google AI Studio API key for chat + embeddings |
| `AUTH_SECRET` | **Yes** (prod) | Secret for HMAC session signing. Use `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | Your public URL (no trailing slash) |
| `DATABASE_URL` | No | Postgres connection string with pgvector. Leave empty for local JSON store |
| `DATABASE_SSL` | No | Set to `false` to disable SSL for local Postgres. Default: `true` |
| `GEMINI_CHAT_MODEL` | No | Override chat model. Default: `gemini-2.0-flash` |
| `GEMINI_EMBED_MODEL` | No | Override embedding model. Default: `text-embedding-004` |
| `RESEND_API_KEY` | No | [Resend](https://resend.com) key for welcome emails |
| `EMAIL_FROM` | No | Sender address for welcome emails |

---

## 📁 Project Structure

```
documind/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST — log in, sets session cookie
│   │   │   ├── logout/route.ts     # POST — clears session cookie
│   │   │   └── register/route.ts   # POST — create account + optional welcome email
│   │   ├── chat/route.ts           # POST — RAG chat with SSE streaming
│   │   ├── collections/
│   │   │   ├── route.ts            # GET/POST — list and create collections
│   │   │   └── [id]/route.ts       # DELETE — remove collection + documents
│   │   ├── documents/
│   │   │   ├── route.ts            # GET — list documents
│   │   │   └── [id]/route.ts       # DELETE — remove document + chunks
│   │   ├── ingest/route.ts         # POST multipart — upload, parse, chunk, embed
│   │   └── me/route.ts             # GET — current user + capability flags
│   ├── auth/page.tsx               # Login / register UI
│   ├── chat/page.tsx               # Real-time chat interface
│   ├── collections/page.tsx        # Collection management
│   ├── documents/page.tsx          # Document upload and management
│   ├── globals.css                 # Design tokens + utility classes
│   ├── layout.tsx                  # Root layout with nav + sidebar
│   └── page.tsx                    # Landing page
├── components/
│   ├── app/
│   │   ├── AuthGate.tsx            # Auth redirect wrapper
│   │   ├── Citations.tsx           # Collapsible source panel
│   │   └── CollectionPicker.tsx    # Collection dropdown
│   ├── landing/
│   │   └── FAQ.tsx                 # Accordion FAQ
│   └── shared/
│       ├── AppSidebar.tsx          # Workspace sidebar (chat/docs/collections)
│       └── Navigation.tsx          # Top navigation with scroll tracking
├── lib/
│   ├── auth.ts                     # HMAC session tokens, cookie helpers
│   ├── chunk.ts                    # Text splitter (1000-char, 150 overlap)
│   ├── embeddings.ts               # Gemini text-embedding-004 + local fallback
│   ├── llm.ts                      # Gemini 2.0 Flash streaming chat
│   ├── mail.ts                     # Resend welcome emails
│   ├── storage/
│   │   ├── adapter.ts              # StorageAdapter interface
│   │   ├── index.ts                # Auto-selects JSON or Postgres
│   │   ├── json-adapter.ts         # Local JSON store for development
│   │   └── postgres-adapter.ts     # Postgres + pgvector for production
│   ├── store.ts                    # Storage facade (user-scoped operations)
│   ├── types.ts                    # Shared TypeScript interfaces
│   ├── use-collections.ts          # Collections fetch hook
│   ├── use-user.ts                 # Current user fetch hook
│   └── utils.ts                    # cn(), generateId(), formatBytes(), relativeTime()
└── .env.example                    # Environment variable reference
```

---

## 🔌 API Routes

### Authentication

```http
POST /api/auth/register
Content-Type: application/json
{ "name": "Alice", "email": "alice@example.com", "password": "securepass" }

POST /api/auth/login
Content-Type: application/json
{ "email": "alice@example.com", "password": "securepass" }

POST /api/auth/logout
→ Clears session cookie
```

### Collections

```http
GET /api/collections
→ { collections: Collection[] }

POST /api/collections
{ "name": "Legal Contracts", "description": "..." }
→ { collection: Collection }

DELETE /api/collections/:id
→ Removes collection + all documents + chunks
```

### Documents

```http
GET /api/documents?collectionId=optional
→ { documents: DocumentMeta[] }

POST /api/ingest (multipart/form-data)
  file: <File>
  collectionId: <string>
→ { document: DocumentMeta }

DELETE /api/documents/:id
→ Removes document + its chunks
```

### Chat (RAG)

```http
POST /api/chat
{ "question": "What were the key risks in Q3?", "collectionId": "optional" }

→ Streaming text/plain response:
  Line 1 (JSON): { "citations": Citation[] }
  Lines 2+:       streaming answer tokens
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard
4. Deploy

```bash
# Or via CLI
npm i -g vercel
vercel deploy
```

### Database: Neon (Recommended Free Tier)

1. Create project at [neon.tech](https://neon.tech)
2. Enable pgvector extension (automatic on Neon)
3. Copy connection string to `DATABASE_URL`

DocuMind creates all tables automatically on first request:
```sql
-- Auto-created by postgres-adapter.ts
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS users (...);
CREATE TABLE IF NOT EXISTS collections (...);
CREATE TABLE IF NOT EXISTS documents (...);
CREATE TABLE IF NOT EXISTS chunks (... embedding vector);
```

### Self-Hosted / Docker

```bash
# Build
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## 🧩 Key Design Decisions

### Dual Storage
- **Development**: Zero-config JSON file store in `./data/`. No database needed.
- **Production**: Postgres + pgvector. Set `DATABASE_URL` and DocuMind auto-migrates.

### Embedding Strategy
- **Without `GEMINI_API_KEY`**: Deterministic bag-of-hashed-tokens (384-dim). Fast, offline, lower accuracy.
- **With `GEMINI_API_KEY`**: `text-embedding-004` batch API (768-dim). High-quality semantic embeddings.
- ⚠️ Re-index all documents when switching providers (dimension mismatch).

### Streaming Architecture
- Chat API emits plain `text/plain` SSE: first newline-delimited JSON header with citations, then raw text tokens.
- No WebSockets or external queues. Stateless Next.js route handlers only.

### Security
- Sessions: HMAC-SHA256 signed, base64url encoded, 7-day expiry, HttpOnly cookies
- Passwords: bcrypt (salt rounds = 10)
- Data isolation: every query scoped by `userId` in WHERE clause

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server (Turbopack)
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

### Adding a new storage adapter

Implement the `StorageAdapter` interface in `lib/storage/adapter.ts` and register it in `lib/storage/index.ts`.

---

## 📊 Supported File Formats

| Format | Extension | Parser |
|--------|-----------|--------|
| PDF | `.pdf` | pdf-parse |
| Markdown | `.md`, `.mdx` | UTF-8 text |
| Plain text | `.txt` | UTF-8 text |
| CSV | `.csv` | UTF-8 text |
| JSON | `.json` | UTF-8 text |
| Code | `.ts`, `.js`, `.py`, `.go`, `.rs`, etc. | UTF-8 text |

---

## 🗺️ Roadmap

- [ ] Multi-file upload (batch ingestion)
- [ ] Document re-indexing (edit + reprocess)
- [ ] Export chat history as PDF/Markdown
- [ ] Shared collections (read-only links)
- [ ] Document summarization endpoint
- [ ] Usage analytics dashboard
- [ ] Multimodal support (images in PDFs via Gemini Vision)

---

## 🤝 Contributing

Pull requests welcome. For major changes, open an issue first.

```bash
git checkout -b feature/my-feature
# make changes
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

## 📄 License

MIT — free to use, modify, and self-host.

---

<div align="center">

Built with ❤️ using **Next.js 15.3** · **Gemini AI** · **pgvector**

</div>
