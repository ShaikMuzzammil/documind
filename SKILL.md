---
name: documind-dev
description: >
  Expert guide for developing, debugging, and extending DocuMind — a self-hosted
  Next.js 16 RAG document intelligence platform. Use this skill whenever the user
  is working on the DocuMind codebase: fixing Vercel build errors, debugging Edge
  Runtime / Node.js runtime conflicts, updating pages or components, configuring
  environment variables, working with pgvector storage, updating the LLM pipeline,
  or packaging a new ZIP release. Also triggers for questions about the proxy.ts
  route guard, the AppSidebar / Navigation conditional rendering, TypeScript errors
  in the project, or any DocuMind-specific deployment issue.
---

# DocuMind — Developer Skill

## Project identity

| Item | Value |
|---|---|
| Repo | github.com/ShaikMuzzammil/documind |
| Owner | Nova (Shaik Muzzammil), CSE undergrad, Amrita Chennai |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 |
| Current version | v4 (documind-v4.zip) |

---

## Architecture overview

```
proxy.ts            ← Next.js 16 Edge route guard (NOT middleware.ts)
app/
  layout.tsx        ← Root layout: <Navigation /> + <AppSidebar /> + <main>
  page.tsx          ← Public landing page
  auth/page.tsx     ← Login / Register
  chat/page.tsx     ← RAG chat interface
  documents/page.tsx
  collections/page.tsx
  analytics/page.tsx
  search/page.tsx
  settings/page.tsx ← Tabs: Profile | AI Engine | Workspace | Notifications | Privacy
  export/page.tsx
  help/page.tsx
  profile/page.tsx
  api/              ← All API routes (must declare runtime = 'nodejs')
components/
  shared/
    Navigation.tsx  ← Top nav bar — HIDDEN on app pages (returns null)
    AppSidebar.tsx  ← Left sidebar — HIDDEN on landing/auth pages
    Logo.tsx
  app/
    AuthGate.tsx
    CollectionPicker.tsx
    Citations.tsx
lib/
  storage/          ← Adapters: postgres-adapter.ts | json-adapter.ts | index.ts
  auth.ts           ← HMAC-SHA256 session tokens (Node.js runtime)
  llm.ts            ← OpenAI-compatible LLM client
  embeddings.ts     ← Embedding generation
  chunk.ts          ← Document chunking (~512 tokens, paragraph-aware)
  analytics.ts      ← buildWorkspaceStats()
  types.ts          ← Shared TypeScript types
  utils.ts          ← cn(), generateId(), formatBytes(), relativeTime()
  use-user.ts       ← useUser() hook → { user, capabilities, loading, refresh }
  use-collections.ts
```

---

## Critical rules (burned in from past debugging)

### Runtime split — this causes ALL Vercel build failures

| File type | Must declare | Reason |
|---|---|---|
| `proxy.ts` | `export async function proxy` (NOT `middleware`) | Next.js 16 naming |
| All `app/api/**/route.ts` | `export const runtime = 'nodejs'` | Uses Node.js crypto/fs |
| `proxy.ts` itself | NO Node.js imports | Runs in Edge Runtime |

**Edge Runtime bans:** `crypto` (Node), `fs`, `path`, `process.cwd()`, `lib/auth.ts`, `lib/storage`.

`proxy.ts` re-implements HMAC-SHA256 verification using `crypto.subtle` (Web Crypto API) — never import from `lib/auth`.

### Navigation / AppSidebar — double branding fix

**Problem:** Both components in `layout.tsx` → two "DocuMind" logos on app pages.

**Fix in `Navigation.tsx`:**
```ts
const APP_PATHS = ['/chat', '/documents', '/collections', '/analytics',
                   '/export', '/search', '/help', '/settings', '/profile'];
const isApp = APP_PATHS.some(p => pathname.startsWith(p));
if (isApp) return null;   // ← prevents double branding
```

**Fix in `AppSidebar.tsx`:** Returns null on non-app paths.

### Page heights

- App pages: `min-h-screen` or `h-screen` (no nav offset needed — Navigation hidden)
- Old pattern `h-[calc(100vh-4rem)]` is wrong — remove if seen
- Chat page: full `h-screen` flex-col + composer with `pb-20 lg:pb-4` for mobile tab bar

### React / package.json

Both `react` and `react-dom` must be `19.2.7`. Add `"overrides": { "react": "19.2.7", "react-dom": "19.2.7" }`.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | ✅ | HMAC session signing |
| `LLM_API_KEY` | ⚡ AI only | LLM provider API key |
| `LLM_BASE_URL` | ⚡ AI only | OpenAI-compatible endpoint |
| `LLM_CHAT_MODEL` | ⚡ AI only | Model name |
| `DATABASE_URL` | 📦 prod | PostgreSQL + pgvector |
| `RESEND_API_KEY` | 📧 email | Resend email service |
| `EMAIL_FROM` | 📧 email | Verified sender address |

**Never expose these in the UI.** All provider setup docs go in README.md only.

---

## Key data types (lib/types.ts)

```ts
DocumentMeta  { id, userId, name, type, size, collectionId, chunkCount, status, error?, createdAt }
Collection    { id, userId, name, description?, createdAt }
Citation      { chunkId, documentId, documentName, index, text, score }
ChatMessage   { id, role: 'user'|'assistant', content, citations?, createdAt }
```

---

## Storage adapters (lib/storage/)

`index.ts` exports `getAdapter()` which returns:
- `postgres-adapter.ts` if `DATABASE_URL` is set (pgvector cosine similarity)
- `json-adapter.ts` otherwise (in-memory / file, resets on Vercel)

All adapters implement the same interface — no other code changes needed.

---

## useUser() hook return shape

```ts
{
  user: { id, email, name, createdAt } | null,
  capabilities: { email: boolean, postgres: boolean, ai: boolean },
  loading: boolean,
  refresh: () => Promise<void>,
}
```

`capabilities.ai` is `true` only when `LLM_API_KEY` is set server-side.

---

## Packaging a release

```bash
zip -r documind-vX.zip documind-folder \
  --exclude "*/node_modules/*" \
  --exclude "*/.next/*" \
  --exclude "*/.git/*"
```

Always run `npx tsc --noEmit` (should exit 0) before packaging.

---

## Common Vercel build errors and fixes

| Error message | Root cause | Fix |
|---|---|---|
| `Proxy is missing expected function export name` | `proxy.ts` exports `middleware` instead of `proxy` | Rename to `export async function proxy` |
| `Module not found: Can't resolve 'fs'` | API route missing `runtime = 'nodejs'` | Add `export const runtime = 'nodejs'` |
| `Cannot find module 'crypto'` (Edge) | `proxy.ts` importing from `lib/auth` | Rewrite using `crypto.subtle` only |
| React version peer conflict | `react` and `react-dom` versions differ | Pin both to `19.2.7` + overrides |
| `h-[calc(100vh-4rem)]` layout broken | Navigation hidden; no 4rem offset | Change to `min-h-screen` or `h-screen` |

---

## Settings page — AI Engine tab policy

**Never show** in the UI:
- API key values or env var names (`LLM_API_KEY`, etc.)
- Provider base URLs
- Code snippets or setup steps

**Show only:**
- Connected ✅ or Not configured ⚠️ status
- List of features enabled/disabled based on status
- Link to README.md and GitHub for setup instructions

All provider setup documentation belongs exclusively in `README.md`.

---

## CSS design tokens (globals.css)

Custom Tailwind classes available everywhere:
- `.glass` — frosted glass surface
- `.gradient-text` — indigo→cyan gradient text
- `.hero-glow` — radial background glow for hero sections
- Color tokens: `bg-accent`, `text-accent`, `text-success`, `text-danger`, `text-warning`, `bg-accent-soft`, `bg-bg-primary/secondary/card/hover`, `text-text-primary/secondary/muted`