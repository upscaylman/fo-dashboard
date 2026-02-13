// ============================================
// Serveur HTTP Node.js Multi-Services
// Sert le build React (dist/) + proxy n8n + health check
// Pas de dependance HTTP.sys, pas besoin d'admin
// ============================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.SERVE_PORT || process.argv[2] || '8080', 10);
const N8N_URL = 'http://localhost:5678';
const OLLAMA_URL = 'http://localhost:11434';
const DIST_DIR = path.join(__dirname, 'dist');

// Verifier que le build existe
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('[ERREUR] Le dossier dist/ n\'existe pas. Lancez "npm run build" d\'abord.');
  process.exit(1);
}

// Types MIME
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

function getMimeType(ext) {
  return MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
}

// Helper: faire une requete HTTP simple
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOpts = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: (options.timeout || 5) * 1000,
    };

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Lire le body d'une requete POST
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Ajouter les headers CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
}

// Serveur principal
const server = http.createServer(async (req, res) => {
  const now = new Date().toLocaleTimeString('fr-FR');
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;

  console.log(`[${now}] ${req.method} ${pathname}`);

  // CORS
  setCorsHeaders(res);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================
  if (pathname === '/api/health') {
    let n8nOk = false;
    let ollamaOk = false;

    try {
      await httpRequest(N8N_URL, { timeout: 3 });
      n8nOk = true;
    } catch {}

    try {
      await httpRequest(OLLAMA_URL, { timeout: 3 });
      ollamaOk = true;
    } catch {}

    const status = n8nOk ? 'ok' : 'degraded';
    const health = {
      status,
      services: {
        n8n: n8nOk ? 'up' : 'down',
        ollama: ollamaOk ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
      service: 'Node.js Server',
    };

    const body = JSON.stringify(health);
    const statusCode = n8nOk ? 200 : 503;
    const color = n8nOk ? '\x1b[32m' : '\x1b[33m';
    console.log(`${color}[HEALTH] ${status} (n8n=${n8nOk ? 'up' : 'down'}, ollama=${ollamaOk ? 'up' : 'down'})\x1b[0m`);

    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
    return;
  }

  // ============================================
  // CONVERSION PDF via PowerShell (Word COM)
  // ============================================
  if (pathname === '/api/convert-pdf' && req.method === 'POST') {
    console.log('\x1b[36m[PDF] Reception requete conversion\x1b[0m');

    try {
      const requestBody = await readBody(req);
      const data = JSON.parse(requestBody);
      const wordBase64 = data.wordBase64;
      const filename = data.filename || 'document';

      if (!wordBase64) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'wordBase64 manquant' }));
        return;
      }

      console.log(`[PDF] Fichier: ${filename}.docx (${wordBase64.length} chars base64)`);

      const os = require('os');
      const { execFileSync } = require('child_process');

      // Creer fichiers temporaires
      const tempDir = os.tmpdir();
      const tempId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const tempWordFile = path.join(tempDir, `docease_${tempId}.docx`);
      const tempPdfFile = path.join(tempDir, `docease_${tempId}.pdf`);
      const tempPsFile = path.join(tempDir, `docease_${tempId}.ps1`);

      // Ecrire le Word temporaire
      const wordBuffer = Buffer.from(wordBase64, 'base64');
      fs.writeFileSync(tempWordFile, wordBuffer);

      // Ecrire le script PowerShell temporaire
      const psScript = [
        '$ErrorActionPreference = "Stop"',
        '$Word = $null',
        '$Doc = $null',
        'try {',
        '  $Word = New-Object -ComObject Word.Application',
        '  $Word.Visible = $false',
        '  $Word.DisplayAlerts = 0',
        `  $Doc = $Word.Documents.Open("${tempWordFile.replace(/\\/g, '\\\\')}")`,
        '  Start-Sleep -Seconds 3',
        `  $Doc.ExportAsFixedFormat("${tempPdfFile.replace(/\\/g, '\\\\')}", 17, $false, 0, 0, 0, 0, 0, $true)`,
        '  $Doc.Close($false)',
        '  $Word.Quit()',
        '  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Doc) | Out-Null',
        '  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Word) | Out-Null',
        '  [System.GC]::Collect()',
        '  [System.GC]::WaitForPendingFinalizers()',
        '  Write-Output "OK"',
        '} catch {',
        '  if ($Doc) { try { $Doc.Close($false) } catch {} }',
        '  if ($Word) { try { $Word.Quit() } catch {} }',
        '  Write-Error $_.Exception.Message',
        '  exit 1',
        '}',
      ].join('\r\n');

      fs.writeFileSync(tempPsFile, psScript, 'utf-8');

      console.log('[PDF] Lancement conversion PowerShell...');
      execFileSync('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', tempPsFile,
      ], {
        timeout: 120000,
        stdio: 'pipe',
        windowsHide: true,
      });

      if (fs.existsSync(tempPdfFile)) {
        const pdfBuffer = fs.readFileSync(tempPdfFile);
        const pdfBase64 = pdfBuffer.toString('base64');

        // Nettoyage
        try { fs.unlinkSync(tempWordFile); } catch {}
        try { fs.unlinkSync(tempPdfFile); } catch {}
        try { fs.unlinkSync(tempPsFile); } catch {}

        const result = JSON.stringify({ pdfBase64 });
        console.log(`\x1b[32m[PDF] OK - ${pdfBuffer.length} bytes\x1b[0m`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(result);
      } else {
        try { fs.unlinkSync(tempWordFile); } catch {}
        try { fs.unlinkSync(tempPsFile); } catch {}
        throw new Error('Fichier PDF non genere');
      }
    } catch (err) {
      console.error(`\x1b[31m[PDF] Erreur: ${err.message}\x1b[0m`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `Erreur conversion PDF: ${err.message}`, success: false }));
    }
    return;
  }

  // ============================================
  // PROXY VERS N8N (tous les /webhook/*)
  // ============================================
  if (pathname.startsWith('/webhook/')) {
    console.log(`\x1b[35m[PROXY] Redirection vers n8n: ${pathname}\x1b[0m`);

    try {
      const requestBody = await readBody(req);
      const proxyUrl = `${N8N_URL}${pathname}`;
      console.log(`[PROXY] -> ${proxyUrl} (body: ${requestBody.length} chars)`);

      const proxyRes = await httpRequest(proxyUrl, {
        method: 'POST',
        body: requestBody,
        headers: { 'Content-Type': 'application/json' },
        timeout: 300,
      });

      console.log(`\x1b[32m[PROXY] OK (${proxyRes.data.length} bytes)\x1b[0m`);
      res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(proxyRes.data);
    } catch (err) {
      console.error(`\x1b[31m[PROXY] Erreur: ${err.message}\x1b[0m`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `Erreur proxy n8n: ${err.message}`, success: false }));
    }
    return;
  }

  // ============================================
  // CONFIG VARIABLES
  // ============================================
  if (pathname === '/config/variables.json') {
    const configPath = path.resolve(__dirname, '../../config/variables.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
      return;
    }
  }

  // ============================================
  // FICHIERS STATIQUES (dist/)
  // ============================================
  let filePath = pathname === '/' ? '/index.html' : pathname;
  let fullPath = path.join(DIST_DIR, filePath);

  // Securite: empecher la traversee de repertoire
  if (!path.resolve(fullPath).startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // SPA fallback: si pas de fichier et pas d'extension, servir index.html
  if (!fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath);
    if (!ext) {
      fullPath = path.join(DIST_DIR, 'index.html');
    }
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    try {
      const ext = path.extname(fullPath);
      const contentType = getMimeType(ext);
      const data = fs.readFileSync(fullPath);

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': data.length,
      });
      res.end(data);
    } catch (err) {
      console.error(`\x1b[31m[ERROR] Lecture fichier ${fullPath}: ${err.message}\x1b[0m`);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else {
    console.log(`\x1b[33m[404] ${pathname}\x1b[0m`);
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Demarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  SERVEUR DOCEASE - Port ' + PORT);
  console.log('============================================');
  console.log('');
  console.log('Adresses:');
  console.log('  - Local:      http://localhost:' + PORT + '/');

  // Obtenir l'IP locale
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('169.254')) {
        console.log('  - Reseau:     http://' + alias.address + ':' + PORT + '/');
        break;
      }
    }
  }
  console.log('  - Docker:     http://host.docker.internal:' + PORT + '/');
  console.log('');
  console.log('Services:');
  console.log('  - /*                   -> Fichiers statiques (dist/)');
  console.log('  - /api/health          -> Health check');
  console.log('  - /webhook/*           -> Proxy vers n8n (' + N8N_URL + ')');
  console.log('  - /config/variables    -> Configuration');
  console.log('');
  console.log('Ctrl+C pour arreter');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[ERREUR] Le port ${PORT} est deja utilise.`);
    console.error('Utilisez stop.bat pour arreter les services existants.');
  } else {
    console.error(`[ERREUR] ${err.message}`);
  }
  process.exit(1);
});
