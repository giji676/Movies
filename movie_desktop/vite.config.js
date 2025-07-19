
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    root: 'renderer',
    plugins: [react()],
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
});
