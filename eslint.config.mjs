import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'data/**'],
  },
  {
    rules: {
      // Allow unused vars starting with _ (convention for intentionally unused)
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      // Allow explicit any in chart tooltip callbacks (Recharts)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];

export default config;
