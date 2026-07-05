# DocuMind Developer Guide v5

## Critical Rules (never break these)

### Runtime split
- ALL `app/api/**` routes: `export const runtime = 'nodejs';` — Edge runtime has no Node.js APIs
- Client components: `'use client';` at top — required for hooks, state, browser APIs
- Never use `DOMMatrix`, `canvas`, or browser-only globals in API routes

### PDF parsing
- Uses `pdf-parse` **v1.1.1** (NOT v2) — v2 requires DOMMatrix which crashes in Node.js
- Import with: `const pdfParse = require('pdf-parse')` (not dynamic import)
- `serverExternalPackages: ['pdf-parse']` in next.config.js prevents webpack bundling it
- Also set `webpack externals` for pdf-parse in next.config.js for belt-and-suspenders

### Double-branding prevention
- `Navigation.tsx` returns `null` on all `/chat`, `/documents`, `/collections`, `/analytics`, `/export`, `/search`, `/help`, `/settings`, `/profile` paths
- `AppSidebar.tsx` returns `null` on `/` (landing page)
- They are always mutually exclusive — never both visible simultaneously

### Security policy (never expose in UI)
- API keys, provider URLs, model names must NEVER appear in any UI component
- Settings AI Engine tab shows only: status badge, feature checklist, and links to README
- All sensitive config lives ONLY in `.env.local` / Vercel environment variables + README.md

### Height rules
- App pages: `min-h-screen` (not `h-screen` unless it's the chat which uses `h-screen` for the fixed layout)
- Chat is the ONLY page using `h-screen flex flex-col` for the fixed scroll area

## Common Vercel Build Errors

| Error | Root cause | Fix |
|-------|-----------|-----|
| `DOMMatrix is not defined` | pdf-parse v2 imported | Use pdf-parse v1, `require()` syntax |
| `Edge Runtime does not support Buffer` | Missing `runtime = 'nodejs'` | Add to API route |
| `Module not found: pdf-parse` | Not in serverExternalPackages | Add to next.config.js |
| `React version mismatch` | Missing overrides in package.json | Add `overrides: { react, react-dom }` |
| `ESLint error on build` | Strict ESLint in CI | Fix lint before pushing |
| `ENOENT /data/users.json` | Vercel filesystem readonly | Use DATABASE_URL (PostgreSQL) |

## Environment Variables
See README.md and .env.example for full list. Never show these in UI.

## Packaging a new release
```bash
cd /path/to/documind
# Clean build artifacts
rm -rf .next tsconfig.tsbuildinfo node_modules/.cache
# Create ZIP (exclude node_modules and .next)
zip -r documind-v5.zip . \
  --exclude "node_modules/*" \
  --exclude ".next/*" \
  --exclude "data/*" \
  --exclude ".env.local"
```

## Page inventory (v5)
| Page | Route | Notes |
|------|-------|-------|
| Landing | `/` | Public, Navigation shown |
| Auth | `/auth` | Login + register |
| Chat | `/chat` | `h-screen` layout, streaming SSE |
| Documents | `/documents` | Upload + table with view modal |
| Collections | `/collections` | Card grid with color coding |
| Analytics | `/analytics` | Recharts + bottom nav links |
| Export | `/export` | 5 format options |
| Search | `/search` | Semantic with session history |
| Help | `/help` | Contact at TOP, guides + FAQ |
| Settings | `/settings` | Profile/AI/Workspace/Notifications/Privacy |
| Profile | `/profile` | Achievement links, real-time stats |
