// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  prettierConfig,
  {
    ignores: ['playwright-report/', 'test-results/', 'node_modules/'],
  },
);
