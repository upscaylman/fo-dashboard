// ============================================================
// DocEase - Bot Telegram de contrôle à distance
// Commandes: /status /demarrer /arreter /logs /url /aide
// ============================================================

require('dotenv').config();
const { Telegraf } = require('telegraf');
const { exec, spawn } = require('child_process');
const path = require('path');
const http = require('http');

// --- Config ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = (process.env.ALLOWED_TELEGRAM_IDS || '')
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(Boolean);

// --- Config monitoring ---
const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL_MS || '60000'); // 60s par defaut
const NOTIFY_CHAT_IDS = ALLOWED_USERS; // envoie les alertes aux users autorises

const DOCEASE_DIR = path.resolve(__dirname, '..');
const DOCKER_DIR  = path.join(DOCEASE_DIR, 'docker');
const FORM_DIR    = path.join(DOCEASE_DIR, 'templates', 'formulaire');
const NGROK_SCRIPT = path.join(DOCEASE_DIR, 'scripts', 'start-ngrok-8080.bat');

if (!BOT_TOKEN) {
  console.error('[ERREUR] TELEGRAM_BOT_TOKEN manquant dans .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// --- Sécurité: vérification utilisateur autorisé ---
function isAllowed(ctx) {
  if (ALLOWED_USERS.length === 0) return true; // si pas de whitelist, tout le monde
  return ALLOWED_USERS.includes(ctx.from?.id);
}

function guard(ctx, next) {
  if (!isAllowed(ctx)) {
    console.log(`[BLOQUE] Utilisateur non autorisé: ${ctx.from?.id} (${ctx.from?.username})`);
    return ctx.reply('Acces refuse. Vous n\'etes pas autorise a utiliser ce bot.');
  }
  return next();
}

// --- Utilitaires ---
function run(cmd, options = {}) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: options.cwd || DOCEASE_DIR, timeout: options.timeout || 60000, windowsHide: true }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        output: (stdout + stderr).trim(),
        code: err?.code
      });
    });
  });
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, (res) => {
      resolve(true);
      req.destroy();
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function getNgrokUrl() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4040/api/tunnels', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tunnel = json.tunnels?.find(t => t.proto === 'https');
          resolve(tunnel?.public_url || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function formatBool(b) { return b ? '✓' : '✗'; }

// ============================================================
// COMMANDES
// ============================================================

// --- /monid (sans guard, accessible à tous pour debug) ---
bot.command('monid', (ctx) => {
  ctx.reply(`Votre ID Telegram: ${ctx.from?.id}\nUsername: @${ctx.from?.username || 'non defini'}`);
});

bot.command('start', guard, (ctx) => {
  ctx.reply(
    'Bot DocEase actif.\n\n' +
    'Commandes disponibles:\n' +
    '/demarrer - Demarrer tous les services DocEase\n' +
    '/arreter  - Arreter tous les services\n' +
    '/status   - Verifier l\'etat des services\n' +
    '/url      - Obtenir l\'URL publique ngrok\n' +
    '/logs     - Afficher les derniers logs n8n\n' +
    '/aide     - Afficher cette aide'
  );
});

bot.command('aide', guard, (ctx) => {
  ctx.reply(
    'Commandes disponibles:\n\n' +
    '/demarrer - Demarrer tous les services DocEase\n' +
    '/arreter  - Arreter tous les services\n' +
    '/status   - Verifier l\'etat des services\n' +
    '/url      - Obtenir l\'URL publique ngrok\n' +
    '/logs     - Afficher les derniers logs n8n (20 dernieres lignes)\n' +
    '/clear    - Effacer toute la discussion\n' +
    '/monitor  - Activer/desactiver les alertes\n' +
    '/aide     - Afficher cette aide'
  );
});

// --- /clear ---
bot.command('clear', guard, async (ctx) => {
  const chatId = ctx.chat.id;
  const currentMsgId = ctx.message.message_id;
  let deleted = 0;
  let failed = 0;

  await ctx.reply('Suppression des messages en cours...');

  // Telegram permet de supprimer les messages des 48 dernieres heures
  // On tente de supprimer les messages un par un en remontant
  for (let id = currentMsgId; id > Math.max(currentMsgId - 500, 0); id--) {
    try {
      await ctx.telegram.deleteMessage(chatId, id);
      deleted++;
    } catch {
      failed++;
      if (failed > 10) break; // arreter apres 10 echecs consecutifs
    }
  }

  // Ce message sera le seul restant
  await ctx.reply(`Discussion effacee (${deleted} messages supprimes).`);
});

// --- /status ---
bot.command('status', guard, async (ctx) => {
  await ctx.reply('Verification en cours...');

  const [n8n, formulaire, ollama, ngrok_dashboard] = await Promise.all([
    checkPort(5678),
    checkPort(8080),
    checkPort(11434),
    checkPort(4040),
  ]);

  const dockerResult = await run('docker compose ps --format "table {{.Name}}\\t{{.Status}}"', { cwd: DOCKER_DIR });
  const ngrokUrl = await getNgrokUrl();

  let msg = 'ETAT DES SERVICES DOCEASE\n';
  msg += '─────────────────────────\n';
  msg += `${formatBool(n8n)} n8n            :5678\n`;
  msg += `${formatBool(formulaire)} Formulaire     :8080\n`;
  msg += `${formatBool(ollama)} Ollama         :11434\n`;
  msg += `${formatBool(ngrok_dashboard)} ngrok dashboard:4040\n`;
  if (ngrokUrl) {
    msg += `\nURL publique:\n${ngrokUrl}`;
  } else {
    msg += '\nURL publique: non disponible';
  }

  if (dockerResult.ok) {
    const lines = dockerResult.output.split('\n').slice(0, 8).join('\n');
    msg += `\n\nConteneurs Docker:\n${lines}`;
  }

  await ctx.reply(msg);
});

// --- /demarrer ---
bot.command('demarrer', guard, async (ctx) => {
  const { existsSync } = require('fs');
  await ctx.reply('Demarrage de DocEase en cours...');
  const resultats = { docker: false, formulaire: false, ngrok: false };

  // === ETAPE 1: Docker ===
  try {
    await ctx.reply('[1/3] Demarrage des conteneurs Docker...');
    const dockerCheck = await run('docker info', { timeout: 10000 });
    if (!dockerCheck.ok) {
      await ctx.reply('[ERREUR] Docker Desktop n\'est pas lance.\nDemarrez Docker Desktop manuellement, puis relancez /demarrer');
      return;
    }
    const dockerUp = await run('docker compose up -d', { cwd: DOCKER_DIR, timeout: 120000 });
    await ctx.reply(dockerUp.ok
      ? '[OK] Conteneurs Docker demarres.'
      : `[ATTENTION] Docker:\n${dockerUp.output.slice(-400)}`);
    resultats.docker = dockerUp.ok;

    // Attente n8n
    if (dockerUp.ok) {
      await ctx.reply('Attente du demarrage de n8n (15s)...');
      await new Promise(r => setTimeout(r, 15000));
    }
  } catch (e) {
    await ctx.reply(`[ERREUR] Etape Docker: ${e.message}`);
  }

  // === ETAPE 2: Serveur formulaire ===
  try {
    await ctx.reply('[2/3] Demarrage du serveur formulaire...');
    const serveScript = path.join(FORM_DIR, 'serve.cjs');
    const distExists = existsSync(path.join(FORM_DIR, 'dist', 'index.html'));

    // Build seulement si dist n'existe pas
    if (!distExists) {
      await ctx.reply('Build en cours (peut prendre 1-2 min)...');
      const buildResult = await run('npm install && npm run build', { cwd: FORM_DIR, timeout: 180000 });
      if (!buildResult.ok) {
        await ctx.reply(`[ATTENTION] Build echoue:\n${buildResult.output.slice(-300)}`);
      }
    }

    // Vérifier si le port 8080 est déjà occupé
    const alreadyRunning = await checkPort(8080);
    if (alreadyRunning) {
      await ctx.reply('[OK] Serveur formulaire deja actif sur :8080');
      resultats.formulaire = true;
    } else if (existsSync(serveScript) && existsSync(path.join(FORM_DIR, 'dist', 'index.html'))) {
      spawn('node', [serveScript], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        cwd: FORM_DIR
      }).unref();
      await new Promise(r => setTimeout(r, 3000));
      const formOk = await checkPort(8080);
      resultats.formulaire = formOk;
      await ctx.reply(formOk
        ? '[OK] Serveur formulaire demarre sur :8080'
        : '[ATTENTION] Serveur formulaire ne repond pas encore');
    } else {
      await ctx.reply('[ATTENTION] serve.cjs ou dist/ introuvable. Lancez un build manuellement.');
    }
  } catch (e) {
    await ctx.reply(`[ERREUR] Etape formulaire: ${e.message}`);
  }

  // === ETAPE 3: ngrok ===
  try {
    await ctx.reply('[3/3] Demarrage de ngrok...');
    const ngrokRunning = await checkPort(4040);
    if (ngrokRunning) {
      const url = await getNgrokUrl();
      await ctx.reply(`[OK] ngrok deja actif.\n${url || 'http://localhost:4040'}`);
      resultats.ngrok = true;
    } else if (existsSync(NGROK_SCRIPT)) {
      spawn('cmd.exe', ['/c', NGROK_SCRIPT], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
      await new Promise(r => setTimeout(r, 6000));
      const ngrokUrl = await getNgrokUrl();
      resultats.ngrok = !!ngrokUrl || await checkPort(4040);
      await ctx.reply(ngrokUrl
        ? `[OK] ngrok demarre.\nURL publique: ${ngrokUrl}`
        : resultats.ngrok
          ? '[OK] ngrok demarre. URL: http://localhost:4040'
          : '[ATTENTION] ngrok n\'a pas repondu.');
    } else {
      await ctx.reply('[ATTENTION] Script ngrok introuvable.');
    }
  } catch (e) {
    await ctx.reply(`[ERREUR] Etape ngrok: ${e.message}`);
  }

  // === RESUME ===
  const ok = (v) => v ? '✓' : '✗';
  await ctx.reply(
    'RESUME\n' +
    '─────────────────\n' +
    `${ok(resultats.docker)} Docker (n8n, Ollama, DB)\n` +
    `${ok(resultats.formulaire)} Formulaire :8080\n` +
    `${ok(resultats.ngrok)} ngrok\n\n` +
    'Utilisez /status pour verifier a tout moment.'
  );
});

// --- /arreter ---
bot.command('arreter', guard, async (ctx) => {
  await ctx.reply('Arret de DocEase en cours...');

  // Stop ngrok
  const ngrokStop = await run('taskkill /IM ngrok.exe /F', { timeout: 10000 });
  await ctx.reply(ngrokStop.ok ? '[OK] ngrok arrete.' : '[INFO] ngrok n\'etait pas actif.');

  // Stop serveur formulaire sur port 8080
  const portKill = await run('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :8080\') do taskkill /F /PID %a', { timeout: 10000 });
  await ctx.reply('[OK] Serveur formulaire arrete.');

  // Stop Docker
  await ctx.reply('Arret des conteneurs Docker...');
  const dockerDown = await run('docker compose down', { cwd: DOCKER_DIR, timeout: 60000 });
  if (dockerDown.ok) {
    await ctx.reply('[OK] Conteneurs Docker arretes.');
  } else {
    await ctx.reply(`[ERREUR] Docker:\n${dockerDown.output.slice(0, 500)}`);
  }

  await ctx.reply('DocEase est arrete.');
});

// --- /url ---
bot.command('url', guard, async (ctx) => {
  const ngrokUrl = await getNgrokUrl();
  if (ngrokUrl) {
    await ctx.reply(`URL publique ngrok:\n${ngrokUrl}\n\nServeur formulaire: ${ngrokUrl}/formulaire`);
  } else {
    await ctx.reply('ngrok n\'est pas actif ou l\'URL n\'est pas disponible.\nVeuillez demarrer DocEase avec /demarrer');
  }
});

// --- /logs ---
bot.command('logs', guard, async (ctx) => {
  await ctx.reply('Recuperation des logs n8n (20 dernieres lignes)...');
  const result = await run('docker compose logs n8n --tail=20 --no-color', { cwd: DOCKER_DIR, timeout: 15000 });
  if (result.output) {
    const truncated = result.output.slice(-3000);
    await ctx.reply(`Logs n8n:\n\n${truncated}`);
  } else {
    await ctx.reply('Aucun log disponible ou Docker non actif.');
  }
});

// --- Gestion erreurs ---
bot.catch((err, ctx) => {
  console.error(`[ERREUR] ${ctx.updateType}:`, err);
  ctx.reply('Une erreur est survenue.').catch(() => {});
});

// ============================================================
// MONITORING - Surveillance automatique des services
// ============================================================
const serviceState = {
  n8n:        { up: null, downSince: null },
  formulaire: { up: null, downSince: null },
  docker:     { up: null, downSince: null },
};
let monitorActive = true;
let monitorInterval = null;

async function notifyAll(message) {
  for (const chatId of NOTIFY_CHAT_IDS) {
    try {
      await bot.telegram.sendMessage(chatId, message);
    } catch (e) {
      console.error(`[MONITOR] Erreur envoi notification a ${chatId}:`, e.message);
    }
  }
}

async function monitorServices() {
  if (!monitorActive) return;

  const services = {
    docker:     await run('docker info', { timeout: 8000 }).then(r => r.ok),
    n8n:        await checkPort(5678),
    formulaire: await checkPort(8080),
  };

  const now = new Date();

  for (const [name, isUp] of Object.entries(services)) {
    const prev = serviceState[name];

    if (prev.up === true && !isUp) {
      // Service vient de tomber
      prev.up = false;
      prev.downSince = now;
      const label = name === 'n8n' ? 'n8n (:5678)' : name === 'formulaire' ? 'Formulaire (:8080)' : 'Docker';
      await notifyAll(
        `ALERTE - Service en panne\n` +
        `─────────────────────\n` +
        `${label} est HORS LIGNE\n` +
        `Depuis: ${now.toLocaleTimeString('fr-FR')}\n\n` +
        `Utilisez /demarrer pour relancer.`
      );
      console.log(`[MONITOR] ${name} DOWN`);
    } else if (prev.up === false && isUp) {
      // Service revient en ligne
      const duration = prev.downSince
        ? Math.round((now - prev.downSince) / 1000 / 60)
        : '?';
      const label = name === 'n8n' ? 'n8n (:5678)' : name === 'formulaire' ? 'Formulaire (:8080)' : 'Docker';
      prev.up = true;
      prev.downSince = null;
      await notifyAll(
        `SERVICE RETABLI\n` +
        `─────────────────────\n` +
        `${label} est de retour EN LIGNE\n` +
        `Duree de panne: ~${duration} min`
      );
      console.log(`[MONITOR] ${name} UP`);
    } else {
      // Premier check ou pas de changement
      prev.up = isUp;
    }
  }
}

// --- /monitor (activer/desactiver la surveillance) ---
bot.command('monitor', guard, async (ctx) => {
  const arg = ctx.message.text.split(' ')[1]?.toLowerCase();

  if (arg === 'off' || arg === 'stop') {
    monitorActive = false;
    if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; }
    await ctx.reply('Surveillance desactivee. Vous ne recevrez plus d\'alertes.');
  } else if (arg === 'on' || arg === 'start') {
    monitorActive = true;
    if (!monitorInterval) {
      monitorInterval = setInterval(monitorServices, MONITOR_INTERVAL);
    }
    await ctx.reply(`Surveillance activee (verification toutes les ${MONITOR_INTERVAL / 1000}s).`);
  } else {
    await ctx.reply(
      `Surveillance: ${monitorActive ? 'ACTIVE' : 'INACTIVE'}\n` +
      `Intervalle: ${MONITOR_INTERVAL / 1000}s\n\n` +
      `Utilisation:\n` +
      `/monitor on  - Activer\n` +
      `/monitor off - Desactiver`
    );
  }
});

// --- Démarrage ---
bot.launch().then(async () => {
  console.log('[OK] Bot Telegram DocEase demarre.');
  console.log(`[INFO] Utilisateurs autorises: ${ALLOWED_USERS.length > 0 ? ALLOWED_USERS.join(', ') : 'tous (aucune restriction)'}`);

  // Enregistrement des commandes dans le menu Telegram
  await bot.telegram.setMyCommands([
    { command: 'demarrer',  description: 'Demarrer tous les services DocEase' },
    { command: 'arreter',   description: 'Arreter tous les services DocEase' },
    { command: 'status',    description: 'Etat des services (n8n, formulaire, ngrok...)' },
    { command: 'url',       description: 'Obtenir l\'URL publique ngrok' },
    { command: 'logs',      description: 'Afficher les derniers logs n8n' },
    { command: 'monitor',   description: 'Activer/desactiver les alertes de panne' },
    { command: 'aide',      description: 'Afficher l\'aide et les commandes disponibles' },
  ]);
  console.log('[OK] Commandes Telegram enregistrees.');

  // Demarrage du monitoring
  monitorInterval = setInterval(monitorServices, MONITOR_INTERVAL);
  console.log(`[OK] Surveillance active (toutes les ${MONITOR_INTERVAL / 1000}s).`);
  // Premier check apres 10s (laisser le temps au bot de s'initialiser)
  setTimeout(monitorServices, 10000);
}).catch(err => {
  console.error('[ERREUR] Impossible de demarrer le bot:', err.message);
  process.exit(1);
});

// Arrêt propre
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
