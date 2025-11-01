import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config to:
// 1) Silence benign Rollup warnings caused by "use client" directives in some libraries
// 2) Improve chunking to reduce the main bundle size warning
// 3) Relax the chunk-size warning threshold a bit for DX
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const msg = typeof warning.message === 'string' ? warning.message : '';
        // Silence noisy "Module level directives cause errors when bundled" warnings for "use client"
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          msg.includes('Module level directives cause errors when bundled') && msg.includes('"use client"')
        ) {
          return; // ignore
        }
        warn(warning);
      },
      output: {
        manualChunks: {
          // Split heavy vendors to keep app chunk leaner
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'tanstack': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'framer': ['framer-motion'],
        },
      },
    },
    // Raise the default 500 kB warning threshold modestly
    chunkSizeWarningLimit: 1024,
  },
});
