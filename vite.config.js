import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        include: ['tests/**/*.{test,spec}.{js,jsx}'],
        exclude: ['tests/hidden/**', 'node_modules/**', 'dist/**'],
        clearMocks: true,
        restoreMocks: true,
        mockReset: true,
    },
});
