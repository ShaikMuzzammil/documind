# DocuMind

DocuMind is a real multi-user document intelligence app. Users create accounts, upload documents into private collections, and ask questions that stream grounded answers with source citations.

## What It Does

- Real signup, login, logout, secure HTTP-only session cookies, and password hashing
- Per-user collections, documents, chunks, and vector search isolation
- PDF/text/Markdown/CSV/JSON/code-like document ingestion
- Chunking, embeddings, semantic retrieval, and cited RAG answers
- Documents dashboard with upload, drag/drop, filtering, deletion, stats, and live refresh
- Collections dashboard with workspace creation, document counts, chunk counts, and scoped chat links
- Optional welcome email for new accounts through Resend
- Local JSON storage for development and Postgres + pgvector for production

## Useful Environment Variables Only

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

### App

| Variable | Required | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Local: `http://localhost:3000`. Vercel: your deployed app URL |
| `AUTH_SECRET` | Production yes | Generate yourself with `openssl rand -base64 32` |

### AI

| Variable | Required | Where to get it |
| --- | --- | --- |
| `LLM_API_KEY` | Yes for AI answers | OpenAI dashboard API keys, or another OpenAI-compatible provider |
| `LLM_BASE_URL` | Yes | OpenAI: `https://api.openai.com/v1` |
| `LLM_CHAT_MODEL` | Yes | Example: `gpt-4o-mini` |
| `LLM_EMBED_MODEL` | Yes | Example: `text-embedding-3-small` |

OpenAI is recommended because one key works for chat and embeddings. If your provider does not support embeddings, DocuMind falls back to local hashing embeddings so the app still runs.

### Database

| Variable | Required | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Production yes | Neon, Supabase, or any Postgres database with pgvector |
| `DATABASE_SSL` | No | Keep `true` for hosted databases |

Leave `DATABASE_URL` empty only for local development. The app will use the git-ignored `./data` JSON store.

### Email

| Variable | Required | Where to get it |
| --- | --- | --- |
| `RESEND_API_KEY` | Optional | Resend API Keys page |
| `EMAIL_FROM` | Optional | A verified sender/domain in Resend, for example `DocuMind <onboarding@yourdomain.com>` |

If email variables are empty, signup still works. The welcome email is simply skipped.

## Where To Get The Keys

- OpenAI API key: create a key in the OpenAI Platform API keys page.
- Database URL: create a Postgres project in Neon or Supabase, enable/install pgvector, then copy the pooled connection string.
- Resend API key: create a Resend account, verify your sending domain or sender address, then create an API key.
- Auth secret: generate locally; do not get this from a provider.

## Local Development

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

Recommended checks before pushing:

```bash
npm run typecheck
npm run lint
npm run build
```

## Vercel Deployment

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Add the environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL.
5. Set `AUTH_SECRET` to a long random value.
6. Set `DATABASE_URL` to a hosted Postgres database with pgvector.
7. Set `LLM_API_KEY` and model values.
8. Optionally set `RESEND_API_KEY` and `EMAIL_FROM`.
9. Deploy.

Vercel settings:

```txt
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
Node.js Version: 20.x or newer
```

## Project Structure

```txt
app/
  api/auth/             Register, login, logout
  api/chat/             Authenticated cited chat
  api/collections/      Authenticated collection CRUD
  api/documents/        Authenticated document CRUD
  api/ingest/           Authenticated document ingestion
  auth/                 Login and signup page
  chat/                 Chat workspace
  collections/          Collection dashboard
  documents/            Document dashboard
components/
  app/                  Auth gate, citations, collection picker
  landing/              Landing FAQ
  shared/               Navigation and app sidebar
lib/
  auth.ts               Signed session cookies
  mail.ts               Optional Resend welcome email
  storage/              JSON and Postgres adapters
  embeddings.ts         Remote/local embeddings
  llm.ts                Streaming OpenAI-compatible chat
```

## Do Not Commit

These are already ignored:

```txt
node_modules/
.next/
.vercel/
data/
.env
.env.local
```

Keep `package-lock.json`; it helps Vercel install the exact dependency tree.
