# DocuMind v6.0 — AI-Powered RAG Document Intelligence Platform

> Upload any document. Ask anything. Every answer cited back to the source.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## What is DocuMind?

DocuMind is a self-hostable **Retrieval-Augmented Generation (RAG)** platform built on Next.js 15, pgvector, and any OpenAI-compatible LLM. Upload PDFs, Markdown, code, CSV, JSON — and immediately chat with your documents, search semantically, and export your knowledge base.

---

## ✨ v6.0 Feature Overview

### 🤖 AI Chat with Session Persistence
- **Persistent chat sessions** stored in PostgreSQL — browse, rename, delete history
- **Session sidebar** (like ChatGPT) — Today / Earlier groupings
- **Streaming responses** with stop button
- **Cited answers** — every claim traced to source chunk with % relevance score
- **Markdown rendering** — headings, lists, code blocks, bold, italic
- **Copy message** button per bubble
- Scoped chat per collection or across all docs
- Suggested prompts on empty state

### 📄 Document Vault
- **Multi-file upload** with drag-and-drop
- **Chunk preview modal** — inspect every extracted text chunk from any document
- **Batch operations** — select all, delete multiple
- **Sort & filter** — by name, size, date, status, collection
- **Status badges** — ready / processing / error with live auto-refresh (3s)
- **Ask AI** button per document → opens chat scoped to that collection
- Supports: PDF · MD · TXT · CSV · JSON · JS/TS · Python · YAML · SQL · HTML · XML · LOG

### 🔍 Semantic Search
- Vector similarity search across your entire knowledge base
- **Highlighted matches** — query terms highlighted in results
- **Relevance score bar** (green/amber/red) per result
- **Collection filter** and result count selector (4/8/12/20)
- **Search history** persisted in localStorage
- **Ask AI about this** → jump from search result directly to chat
- Keyboard shortcuts: Enter to search, Escape to clear

### 📊 Analytics Dashboard
- **Index health ring** — % of docs successfully indexed
- **14-day upload bar chart** — track ingestion velocity
- **Sparkline** on total documents card
- **Per-collection breakdown** table — docs, chunks, size, coverage bar
- **Storage gauge** per collection
- Live chat session count
- Auto-refreshes every 30 seconds

### 📦 Export Center
- **4 formats**: JSON · CSV · Markdown · JSONL (for LLM fine-tuning)
- **3 targets**: Document index · Knowledge chunks · Chat history
- Collection-scoped export
- Instant browser download — no server storage

### 🗂 Collections
- Namespace documents into collections
- Scoped chat, search, and export per collection
- Rename inline, delete with cascade

### ⚙️ Settings
- Plug in any OpenAI-compatible provider (OpenAI, Groq, Ollama, Together)
- Configure model name and base URL
- Never exposes environment variable names
- Database setup guide for pgvector

### 🏠 Landing Page
- Live demo chat terminal mockup
- 9-feature grid with icons
- 3-step how-it-works section
- 12 supported formats badges

---

## 🚀 Deployment Guide

### Prerequisites
- [Vercel account](https://vercel.com) (free)
- [Neon database](https://neon.tech) (free) — Postgres with pgvector
- OpenAI API key (or compatible provider)

### Step 1 — Enable pgvector on Neon
1. Open your Neon project → **Tables** → run: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Or: Dashboard → **Extensions** → search "vector" → Enable

### Step 2 — Deploy to Vercel
```bash
# Clone / fork the repo, then:
vercel --prod
```

### Step 3 — Set environment variables in Vercel Dashboard

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon connection string (pooled) | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Random 32+ char string | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Your LLM provider API key | `sk-...` |
| `OPENAI_BASE_URL` | Optional: custom endpoint | `https://api.groq.com/openai/v1` |
| `OPENAI_MODEL` | Model name | `gpt-4o-mini` |
| `EMBED_MODEL` | Embedding model | `text-embedding-ada-002` |

### Step 4 — First run
- Navigate to your Vercel URL
- Sign up (first user is admin)
- Create a collection
- Upload a document
- Start chatting!

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  /chat       │  │  /documents  │  │  /analytics   │ │
│  │  Sessions    │  │  Upload+     │  │  Dashboard    │ │
│  │  Sidebar     │  │  Preview     │  │  Charts       │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘ │
│         │                 │                              │
│  ┌──────▼─────────────────▼──────────────────────────┐  │
│  │              API Routes (Node.js runtime)          │  │
│  │  /api/chat  /api/chat/sessions  /api/ingest        │  │
│  │  /api/documents  /api/search  /api/collections     │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
  ┌──────▼──────┐                  ┌───────▼────────┐
  │   pgvector  │                  │  OpenAI API    │
  │  (Neon DB)  │                  │  (or compatible│
  │             │                  │   provider)    │
  │  users      │                  │                │
  │  documents  │                  │  Embeddings    │
  │  chunks     │  ◄──────────────►│  ada-002       │
  │  (vectors)  │                  │                │
  │  sessions   │                  │  Chat          │
  │  messages   │                  │  gpt-4o-mini   │
  └─────────────┘                  └────────────────┘
```

---

## 📁 Project Structure

```
documind/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/page.tsx         # Login / signup
│   ├── chat/page.tsx         # ★ Chat with session sidebar
│   ├── documents/page.tsx    # ★ Upload + chunk preview
│   ├── collections/page.tsx  # Collection management
│   ├── analytics/page.tsx    # ★ Dashboard with charts
│   ├── search/page.tsx       # ★ Semantic search
│   ├── export/page.tsx       # ★ Export center
│   ├── settings/page.tsx     # AI engine config
│   ├── help/page.tsx         # Help & docs
│   ├── profile/page.tsx      # Account info
│   └── api/
│       ├── auth/             # Login · logout · register
│       ├── chat/             # Stream chat + sessions CRUD
│       ├── documents/        # List · delete · preview
│       ├── ingest/           # Upload + chunk + embed
│       ├── search/           # GET + POST semantic search
│       ├── collections/      # CRUD collections
│       └── me/               # Current user + capabilities
├── components/
│   ├── app/
│   │   ├── AuthGate.tsx      # Session guard
│   │   ├── CollectionPicker.tsx
│   │   └── Navigation.tsx    # Mobile bottom nav
│   └── shared/
│       └── AppSidebar.tsx    # ★ Sidebar with live stats
├── lib/
│   ├── types.ts              # All domain types
│   ├── store.ts              # Storage facade
│   ├── llm.ts                # LLM streaming
│   ├── embeddings.ts         # Embedding generation
│   ├── auth.ts               # JWT helpers
│   ├── utils.ts              # formatBytes, relativeTime
│   ├── use-user.ts           # User hook
│   ├── use-collections.ts    # Collections hook
│   └── storage/
│       ├── adapter.ts        # Interface (+ chat sessions)
│       ├── index.ts          # Selector
│       ├── postgres-adapter.ts # pgvector implementation
│       └── json-adapter.ts   # In-memory fallback
└── next.config.js
```

---

## 🛠 Local Development

```bash
git clone <repo>
cd documind
npm install

# Copy env
cp .env.example .env.local
# Fill in DATABASE_URL, JWT_SECRET, OPENAI_API_KEY

npm run dev
# → http://localhost:3000
```

### Without a database (demo mode)
Leave `DATABASE_URL` unset — DocuMind falls back to the in-memory JSON adapter.
Data resets on every restart. Good for UI testing.

---

## 🔧 Troubleshooting

### "pgvector extension is not enabled"
Run in your Neon SQL editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
Then retry uploading.

### "Could not connect to the database"
Check your `DATABASE_URL` in Vercel → Settings → Environment Variables.
Make sure you're using the **pooled** connection string from Neon.

### Uploads fail silently
- Check file is under 15 MB
- Ensure collection is selected
- Check Vercel Function logs for the `/api/ingest` route

### Chat returns "I couldn't find an answer"
Documents may not be indexed yet (status = error or processing).
Go to Documents, check status. If error, the error message explains why.

---

## 📄 License

MIT — free to use, modify, and deploy.

---

*DocuMind v6.0 — Built with Next.js 15 · pgvector · OpenAI · Vercel*
