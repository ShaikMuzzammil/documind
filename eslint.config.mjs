import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const compat     = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'data/**'],
  },
  {
    rules: {
      // Allow _prefixed vars as intentionally unused
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern:    '^_',
        argsIgnorePattern:    '^_',
        caughtErrors:         'none',        // never error on empty catch (err)
        ignoreRestSiblings:   true,
      }],
      // Recharts tooltip callbacks need any
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow void expressions (fire-and-forget async calls)
      '@typescript-eslint/no-floating-promises': 'off',
      // Allow empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Allow bare-label ternaries in some patterns — handled by caughtErrors:none above
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit:   true,
        allowTernary:        false,
        allowTaggedTemplates: true,
      }],
    },
  },
];

export default config;
