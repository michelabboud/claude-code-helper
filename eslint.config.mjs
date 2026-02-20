import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/venv/**',
      '**/coverage/**',
      'demo/**',
      '**/*.test.ts',
    ],
  },

  // TypeScript files only - MCP servers and trigger-matcher
  {
    files: [
      'mcp-servers/*/src/**/*.ts',
      'trigger-matcher/src/**/*.ts',
    ],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      'no-useless-escape': 'error',
      'no-case-declarations': 'error',
      'prefer-const': 'error',

      // Allow console in MCP servers (they use stdio transport)
      'no-console': 'off',
    },
  },

  // Script files (Node.js)
  {
    files: ['scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
);
