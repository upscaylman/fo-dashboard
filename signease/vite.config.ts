import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        hmr: isProduction ? false : {
          // HMR uniquement en développement
          clientPort: 5000,
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000,
        // Désactiver modulePreload pour éviter le chargement inutile de chunks lourds (jspdf 376kB) au démarrage
        modulePreload: false,
        rollupOptions: {
          output: {
            manualChunks: {
              'pdf-worker': ['pdfjs-dist'],
              'pdf-lib': ['pdf-lib'],
              'react-pdf': ['@react-pdf/renderer'],
              'firebase': ['firebase/app', 'firebase/firestore', 'firebase/storage'],
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-icons': ['lucide-react'],
              'crypto': ['node-forge', 'jose', '@signpdf/signpdf', '@signpdf/signer-p12', '@signpdf/placeholder-plain'],
              // Séparer doc-utils en chunks plus petits
              'mammoth': ['mammoth'],
              'html2canvas': ['html2canvas'],
              'jspdf': ['jspdf'],
            }
          }
        }
      }
    };
});
