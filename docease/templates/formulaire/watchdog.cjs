// ============================================
// Watchdog pour serve.cjs
// Surveille le processus et le relance automatiquement
// en cas de crash ou si le port 8080 ne repond plus.
// ============================================
// Usage: node watchdog.cjs [port]
// ============================================

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = parseInt(process.env.SERVE_PORT || process.argv[2] || '8080', 10);
const SERVE_SCRIPT = path.join(__dirname, 'serve.cjs');
const HEALTH_CHECK_INTERVAL = 15000; // 15 secondes
const HEALTH_CHECK_TIMEOUT = 5000;   // 5 secondes de timeout
const RESTART_DELAY = 3000;          // 3 secondes avant redemarrage
const MAX_RAPID_RESTARTS = 5;        // max 5 restarts en 60s
const RAPID_RESTART_WINDOW = 60000;  // fenetre de 60 secondes

let child = null;
let healthTimer = null;
let restartTimestamps = [];
let stopping = false;

function log(level, msg) {
  const ts = new Date().toLocaleTimeString('fr-FR');
  const colors = { INFO: '\x1b[36m', OK: '\x1b[32m', WARN: '\x1b[33m', ERR: '\x1b[31m' };
  const color = colors[level] || '';
  console.log(`${color}[${ts}] [WATCHDOG] [${level}] ${msg}\x1b[0m`);
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/health`, { timeout: HEALTH_CHECK_TIMEOUT }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function startServer() {
  if (stopping) return;

  // Protection contre les boucles de redemarrage rapide
  const now = Date.now();
  restartTimestamps = restartTimestamps.filter(t => now - t < RAPID_RESTART_WINDOW);
  if (restartTimestamps.length >= MAX_RAPID_RESTARTS) {
    log('ERR', `${MAX_RAPID_RESTARTS} redemarrages en moins de 60s. Arret du watchdog.`);
    log('ERR', 'Corrigez le probleme puis relancez: node watchdog.cjs');
    process.exit(1);
  }
  restartTimestamps.push(now);

  log('INFO', `Demarrage de serve.cjs sur le port ${PORT}...`);

  child = spawn(process.execPath, [SERVE_SCRIPT, String(PORT)], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;
    if (code !== null) {
      log('WARN', `serve.cjs s'est arrete (code: ${code}). Redemarrage dans ${RESTART_DELAY / 1000}s...`);
    } else {
      log('WARN', `serve.cjs tue par signal ${signal}. Redemarrage dans ${RESTART_DELAY / 1000}s...`);
    }
    setTimeout(startServer, RESTART_DELAY);
  });

  child.on('error', (err) => {
    log('ERR', `Impossible de lancer serve.cjs: ${err.message}`);
    child = null;
    if (!stopping) {
      setTimeout(startServer, RESTART_DELAY);
    }
  });
}

function startHealthMonitor() {
  let consecutiveFailures = 0;

  healthTimer = setInterval(async () => {
    if (!child || stopping) return;

    const ok = await checkHealth();
    if (ok) {
      if (consecutiveFailures > 0) {
        log('OK', `Serveur de nouveau en ligne apres ${consecutiveFailures} echec(s).`);
      }
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      log('WARN', `Health check echoue (${consecutiveFailures}/3)`);

      if (consecutiveFailures >= 3) {
        log('ERR', '3 health checks echoues consecutifs. Redemarrage force...');
        consecutiveFailures = 0;
        if (child) {
          child.kill('SIGTERM');
          // Le handler 'exit' ci-dessus se chargera du redemarrage
        } else {
          startServer();
        }
      }
    }
  }, HEALTH_CHECK_INTERVAL);
}

function shutdown() {
  if (stopping) return;
  stopping = true;
  log('INFO', 'Arret du watchdog...');

  if (healthTimer) clearInterval(healthTimer);

  if (child) {
    child.kill('SIGTERM');
    // Donner 5s au processus pour s'arreter proprement
    const forceTimer = setTimeout(() => {
      if (child) {
        log('WARN', 'Arret force de serve.cjs');
        child.kill('SIGKILL');
      }
    }, 5000);
    child.on('exit', () => {
      clearTimeout(forceTimer);
      log('OK', 'Watchdog arrete.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Demarrage
console.log('');
console.log('============================================');
console.log('  WATCHDOG DocEase - Port ' + PORT);
console.log('  Surveillance automatique de serve.cjs');
console.log('  Auto-restart en cas de crash ou hang');
console.log('============================================');
console.log('');

startServer();

// Attendre un peu que le serveur demarre avant de lancer le health check
setTimeout(startHealthMonitor, 10000);
