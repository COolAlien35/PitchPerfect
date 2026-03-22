import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        // Exclude Playwright e2e specs — those run via `npx playwright test`
        exclude: ['tests/e2e/**', '**/node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['hooks/**', 'lib/**', '../hooks/**', '../stores/**'],
            thresholds: { lines: 70, functions: 70, branches: 60 },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            '@root': path.resolve(__dirname, '../'),
        },
    },
});
