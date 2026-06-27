import { MAX_FILE_SIZE_BYTES, MIN_PASSWORD_LEN, SUPPORTED_EXTENSIONS } from '@/lib/constants';

export interface ValidationResult {
  valid:  boolean;
  errors: string[];
}

/* ── Email ───────────────────────────────────────────────────────────────── */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  if (!email || !email.trim()) errors.push('Email is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
    errors.push('Please enter a valid email address.');
  return { valid: errors.length === 0, errors };
}

/* ── Password ────────────────────────────────────────────────────────────── */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  if (!password) errors.push('Password is required.');
  else {
    if (password.length < MIN_PASSWORD_LEN)
      errors.push(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
    if (password.length > 128)
      errors.push('Password must be under 128 characters.');
  }
  return { valid: errors.length === 0, errors };
}

/* ── Name ────────────────────────────────────────────────────────────────── */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  if (!name || !name.trim())  errors.push('Name is required.');
  else if (name.trim().length < 2) errors.push('Name must be at least 2 characters.');
  else if (name.trim().length > 80) errors.push('Name must be under 80 characters.');
  return { valid: errors.length === 0, errors };
}

/* ── Collection name ─────────────────────────────────────────────────────── */
export function validateCollectionName(name: string): ValidationResult {
  const errors: string[] = [];
  if (!name || !name.trim())    errors.push('Collection name is required.');
  else if (name.trim().length < 1) errors.push('Collection name cannot be empty.');
  else if (name.trim().length > 100) errors.push('Collection name must be under 100 characters.');
  return { valid: errors.length === 0, errors };
}

/* ── File ────────────────────────────────────────────────────────────────── */
export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];
  if (file.size > MAX_FILE_SIZE_BYTES)
    errors.push(`File exceeds 20 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
  if (!SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number]))
    errors.push(`Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
  return { valid: errors.length === 0, errors };
}

/* ── Schema field key ────────────────────────────────────────────────────── */
export function validateSchemaKey(key: string): ValidationResult {
  const errors: string[] = [];
  if (!key || !key.trim()) errors.push('Field key is required.');
  else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key.trim()))
    errors.push('Field key must start with a letter or underscore and contain only alphanumerics and underscores.');
  else if (key.length > 50)
    errors.push('Field key must be under 50 characters.');
  return { valid: errors.length === 0, errors };
}

/* ── Query ───────────────────────────────────────────────────────────────── */
export function validateQuery(q: string): ValidationResult {
  const errors: string[] = [];
  if (!q || !q.trim())    errors.push('Query cannot be empty.');
  else if (q.trim().length < 2) errors.push('Query must be at least 2 characters.');
  else if (q.length > 2000)     errors.push('Query must be under 2000 characters.');
  return { valid: errors.length === 0, errors };
}
