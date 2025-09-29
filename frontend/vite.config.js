import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
    root: 'renderer',
    plugins: [react()],
    envDir: path.resolve(__dirname), // <-- project root
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        host: true, // needed for LAN access
        ...(mode === 'dev' && {
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                    secure: false,
                },
                '/media/downloads': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                    secure: false,
                }
            }
        })
    },
}));
