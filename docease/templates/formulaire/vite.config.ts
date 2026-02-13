import path from 'path';
import http from 'http';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Verifie si un service repond sur un port donne (TCP connect)
function checkService(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}`, { timeout: timeoutMs }, (res) => {
      res.resume(); // consommer la reponse
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// Middleware /api/health + CORS (reutilise pour dev ET preview)
function healthMiddleware(req: any, res: any) {
  // Headers CORS complets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  Promise.all([
    checkService('localhost', 5678),
    checkService('localhost', 11434),
  ]).then(([n8nOk, ollamaOk]) => {
    const allOk = n8nOk;
    res.statusCode = allOk ? 200 : 503;
    res.end(JSON.stringify({
      status: allOk ? 'ok' : 'degraded',
      services: { n8n: n8nOk ? 'up' : 'down', ollama: ollamaOk ? 'up' : 'down' },
      timestamp: new Date().toISOString(),
    }));
  }).catch(() => {
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', timestamp: new Date().toISOString() }));
  });
}

// Plugin /api/health - fonctionne en mode dev ET preview (production)
function healthCheckPlugin(): Plugin {
  return {
    name: 'health-check',
    configureServer(server) {
      server.middlewares.use('/api/health', healthMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/health', healthMiddleware);
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
      server: {
        port: 8080,
        host: '0.0.0.0',
        allowedHosts: ['dee-wakeful-succulently.ngrok-free.dev'],
        proxy: {
          '/webhook': {
            target: 'http://localhost:5678',
            changeOrigin: true,
          },
        },
      },
      preview: {
        port: 8080,
        host: '0.0.0.0',
        allowedHosts: ['dee-wakeful-succulently.ngrok-free.dev'],
        proxy: {
          '/webhook': {
            target: 'http://localhost:5678',
            changeOrigin: true,
          },
        },
      },
      plugins: [healthCheckPlugin(), react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
