export const APP_NAME     = 'DocuMind';
export const APP_VERSION  = '3.1.0';
export const APP_TAGLINE  = 'Document Intelligence Platform';

/* Upload limits */
export const MAX_FILE_SIZE_BYTES  = 20 * 1024 * 1024; // 20 MB
export const MAX_FILES_PER_UPLOAD = 50;
export const SUPPORTED_EXTENSIONS = [
  '.pdf','.txt','.md','.markdown',
  '.csv','.json','.ts','.tsx','.js','.jsx',
  '.py','.html','.xml','.yaml','.yml','.toml',
] as const;
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain','text/markdown','text/csv',
  'application/json',
  'text/html','text/xml','application/xml',
] as const;

/* RAG */
export const DEFAULT_TOP_K   = 5;
export const MAX_TOP_K       = 12;
export const CHUNK_SIZE      = 512;
export const CHUNK_OVERLAP   = 64;
export const EMBEDDING_DIM   = 768;

/* Auth */
export const SESSION_COOKIE    = 'dm_session';
export const SESSION_MAX_AGE   = 60 * 60 * 24 * 30; // 30 days
export const MIN_PASSWORD_LEN  = 8;
export const MAX_PASSWORD_LEN  = 128;

/* Pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

/* AI */
export const DEFAULT_CHAT_MODEL  = 'gemini-2.0-flash';
export const DEFAULT_EMBED_MODEL = 'text-embedding-004';
export const MAX_CONTEXT_TOKENS  = 8000;
export const MAX_OUTPUT_TOKENS   = 2048;

/* UI */
export const TOAST_DURATION_MS = 4000;
export const DEBOUNCE_MS       = 280;
export const SIDEBAR_WIDTH     = 224; // px

/* Routes */
export const PROTECTED_ROUTES = [
  '/chat','/documents','/collections','/analytics',
  '/export','/settings','/search','/profile','/workspace',
] as const;

export const NAV_ITEMS = [
  { href: '/workspace',   label: 'Dashboard',   emoji: '⚡' },
  { href: '/chat',        label: 'Chat',         emoji: '💬' },
  { href: '/documents',   label: 'Documents',    emoji: '📄' },
  { href: '/collections', label: 'Collections',  emoji: '📁' },
  { href: '/analytics',   label: 'Analytics',    emoji: '📊' },
  { href: '/export',      label: 'Export',       emoji: '⬇️'  },
  { href: '/search',      label: 'Search',       emoji: '🔍' },
  { href: '/settings',    label: 'Settings',     emoji: '⚙️'  },
] as const;
