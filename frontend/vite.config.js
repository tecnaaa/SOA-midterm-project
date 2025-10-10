import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/auth': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: command === 'serve',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['axios', 'sweetalert2']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'axios', 'sweetalert2']
    }
  };
});
