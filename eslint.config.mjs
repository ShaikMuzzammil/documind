import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const compat     = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars':    ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any':   'warn',
      'react/no-unescaped-entities':          'error',
      'react-hooks/rules-of-hooks':           'error',
      'react-hooks/exhaustive-deps':          'warn',
      '@next/next/no-html-link-for-pages':    'error',
    },
  },
];
