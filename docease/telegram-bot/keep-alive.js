// ============================================================
// Supabase Keep-Alive — Ping permanent + alertes Telegram
// + Auto-restore si projet en pause
// Utilise la config Telegram de DocEase (.env)
// Usage: node keep-alive.js
// ============================================================

require('dotenv').config();
const https = require('https');

// --- Config Supabase ---
const SUPABASE_URL = 'https://geljwonckfmdkaywaxly.supabase.co';
const SUPABASE_PROJECT_REF = 'geljwonckfmdkaywaxly';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN; // Token Management API

// --- Config Telegram (depuis .env DocEase) ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map(id => id.trim()).filter(Boolean);

// --- Config Intervalles ---
const PING_INTERVAL_MS = 4 * 60 * 60 * 1000;  // 4 heures
const REPORT_HOUR = 9; // Rapport quotidien à 9h
const RESTORE_AFTER_FAILURES = 2; // Tenter restore après N échecs consécutifs
const RESTORE_POLL_INTERVAL_MS = 30 * 1000; // Vérifier toutes les 30s après restore
const RESTORE_MAX_WAIT_MS = 10 * 60 * 1000; // Max 10 min d'attente après restore

if (!BOT_TOKEN || CHAT_IDS.length === 0) {
  console.error('[ERREUR] TELEGRAM_BOT_TOKEN ou ALLOWED_TELEGRAM_IDS manquant dans .env');
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  console.warn('[WARN] SUPABASE_ACCESS_TOKEN manquant — auto-restore désactivé');
  console.warn('       Créer un token sur https://supabase.com/dashboard/account/tokens');
}

// --- Stats ---
let stats = {
  startedAt: new Date(),
  totalPings: 0,
  successPings: 0,
  failedPings: 0,
  lastPing: null,
  lastStatus: null,
  lastError: null,
  consecutiveFailures: 0,
  restoreAttempts: 0,
  restoreSuccesses: 0,
  lastRestore: null,
  isRestoring: false,
};

// --- HTTP Request Helper (no dependencies) ---
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000,
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    if (options.body) req.write(options.body);
    req.end();
  });
}

// --- Telegram ---
async function sendTelegram(message) {
  for (const chatId of CHAT_IDS) {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      await httpRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
    } catch (err) {
      console.error(`[Telegram] Erreur envoi vers ${chatId}:`, err.message);
    }
  }
}

// --- Supabase Management API ---
async function checkProjectStatus() {
  if (!SUPABASE_ACCESS_TOKEN) return null;
  try {
    const res = await httpRequest(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}` },
    });
    const project = JSON.parse(res.data);
    return project.status; // ACTIVE_HEALTHY, INACTIVE, COMING_UP, etc.
  } catch (err) {
    console.error('[Management API] Erreur check status:', err.message);
    return null;
  }
}

async function restoreProject() {
  if (!SUPABASE_ACCESS_TOKEN) return false;
  try {
    const res = await httpRequest(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`[Restore] API response: ${res.status}`);
    return res.status === 200 || res.status === 201;
  } catch (err) {
    console.error('[Restore] Erreur appel API:', err.message);
    return false;
  }
}

async function waitForProjectReady() {
  const startWait = Date.now();
  while (Date.now() - startWait < RESTORE_MAX_WAIT_MS) {
    await new Promise(r => setTimeout(r, RESTORE_POLL_INTERVAL_MS));
    const status = await checkProjectStatus();
    console.log(`[Restore] Polling status: ${status} (${Math.round((Date.now() - startWait) / 1000)}s)`);
    if (status === 'ACTIVE_HEALTHY') return true;
  }
  return false;
}

async function attemptRestore() {
  stats.isRestoring = true;
  stats.restoreAttempts++;
  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  console.log(`[${timestamp}] 🔄 Tentative de restore #${stats.restoreAttempts}...`);

  // Vérifier le statut du projet
  const status = await checkProjectStatus();
  console.log(`[Restore] Statut actuel du projet: ${status}`);

  if (status === 'ACTIVE_HEALTHY') {
    console.log('[Restore] Le projet est déjà actif, problème réseau temporaire ?');
    stats.isRestoring = false;
    await sendTelegram(
      `ℹ️ <b>Auto-Restore: Projet déjà actif</b>\n\n` +
      `Le statut Supabase est ACTIVE_HEALTHY.\n` +
      `Les échecs sont probablement dus à un problème réseau temporaire.`
    );
    return;
  }

  if (status === 'COMING_UP') {
    console.log('[Restore] Le projet est déjà en cours de démarrage');
    await sendTelegram(`⏳ <b>Supabase déjà en cours de redémarrage</b>\nStatut: ${status}`);
  } else {
    // Tenter le restore
    await sendTelegram(
      `🔄 <b>Auto-Restore Supabase lancé</b>\n\n` +
      `📋 Statut détecté: ${status || 'inconnu'}\n` +
      `🕐 ${timestamp}\n` +
      `⏳ Attente du redémarrage (max ${RESTORE_MAX_WAIT_MS / 60000} min)...`
    );

    const restoreOk = await restoreProject();
    if (!restoreOk) {
      stats.isRestoring = false;
      await sendTelegram(
        `❌ <b>Échec appel API restore</b>\n\n` +
        `L'API Management a refusé le restore.\n` +
        `→ Vérifier manuellement: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}`
      );
      return;
    }
  }

  // Attendre que le projet soit de nouveau en ligne
  const ready = await waitForProjectReady();

  if (ready) {
    stats.restoreSuccesses++;
    stats.consecutiveFailures = 0;
    stats.lastRestore = timestamp;
    stats.isRestoring = false;

    // Re-ping pour confirmer
    const { allOk, results } = await pingSupabase();

    await sendTelegram(
      `✅ <b>Supabase restauré avec succès !</b>\n\n` +
      `🕐 ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n` +
      `📡 Ping de confirmation: ${allOk ? '✅ OK' : '⚠️ Partiel'}\n` +
      (results.length > 0 ? results.map(r => `${r.ok ? '✅' : '❌'} ${r.name}: ${r.ok ? r.status : (r.error || r.status)}`).join('\n') : '') +
      `\n\n📊 Restores: ${stats.restoreSuccesses}/${stats.restoreAttempts}`
    );
  } else {
    stats.isRestoring = false;
    await sendTelegram(
      `⚠️ <b>Restore lancé mais projet pas encore prêt</b>\n\n` +
      `Le projet n'est pas redevenu ACTIVE_HEALTHY après ${RESTORE_MAX_WAIT_MS / 60000} min.\n` +
      `Il est possible qu'il ait besoin de plus de temps.\n` +
      `→ Vérifier: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}`
    );
  }
}

// --- Ping Supabase ---
async function pingSupabase() {
  // Si un restore est en cours, skip le ping
  if (stats.isRestoring) {
    console.log(`[${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}] ⏳ Restore en cours, ping ignoré`);
    return { allOk: false, results: [] };
  }

  const results = [];
  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  stats.totalPings++;
  stats.lastPing = timestamp;

  // 1. REST API
  try {
    const res = await httpRequest(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    results.push({ name: 'REST API', ok: res.status < 500, status: res.status });
  } catch (err) {
    results.push({ name: 'REST API', ok: false, error: err.message });
  }

  // 2. Auth API
  try {
    const res = await httpRequest(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { 'apikey': SUPABASE_ANON_KEY },
    });
    results.push({ name: 'Auth', ok: res.status === 200, status: res.status });
  } catch (err) {
    results.push({ name: 'Auth', ok: false, error: err.message });
  }

  // 3. Edge Function
  try {
    const res = await httpRequest(`${SUPABASE_URL}/functions/v1/db-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table: 'users', select: 'id', limit: 1 }),
    });
    results.push({ name: 'Edge Fn', ok: res.status === 200, status: res.status });
  } catch (err) {
    results.push({ name: 'Edge Fn', ok: false, error: err.message });
  }

  const allOk = results.every(r => r.ok);

  if (allOk) {
    stats.successPings++;
    stats.consecutiveFailures = 0;
    stats.lastStatus = 'OK';
    stats.lastError = null;
    console.log(`[${timestamp}] ✅ Ping OK — REST:${results[0].status} Auth:${results[1].status} Edge:${results[2].status}`);
  } else {
    stats.failedPings++;
    stats.consecutiveFailures++;
    const errors = results.filter(r => !r.ok).map(r => `${r.name}: ${r.error || r.status}`);
    stats.lastStatus = 'ERREUR';
    stats.lastError = errors.join(', ');
    console.error(`[${timestamp}] ❌ Ping FAILED — ${errors.join(', ')}`);

    // Alerte Telegram immédiate
    const emoji = stats.consecutiveFailures >= 3 ? '🚨' : '⚠️';
    await sendTelegram(
      `${emoji} <b>Supabase Keep-Alive</b>\n\n` +
      `Échec ping #${stats.consecutiveFailures}\n` +
      `🕐 ${timestamp}\n\n` +
      results.map(r => `${r.ok ? '✅' : '❌'} ${r.name}: ${r.ok ? r.status : (r.error || r.status)}`).join('\n') +
      (stats.consecutiveFailures >= RESTORE_AFTER_FAILURES && SUPABASE_ACCESS_TOKEN
        ? `\n\n🔄 Tentative d'auto-restore en cours...`
        : stats.consecutiveFailures >= RESTORE_AFTER_FAILURES && !SUPABASE_ACCESS_TOKEN
        ? `\n\n⚠️ Auto-restore impossible (SUPABASE_ACCESS_TOKEN manquant)\n→ https://supabase.com/dashboard`
        : `\n\n💡 Si ${RESTORE_AFTER_FAILURES}+ échecs consécutifs, auto-restore sera tenté.`)
    );

    // Auto-restore si assez d'échecs et token disponible
    if (stats.consecutiveFailures >= RESTORE_AFTER_FAILURES && SUPABASE_ACCESS_TOKEN && !stats.isRestoring) {
      await attemptRestore();
    }
  }

  return { allOk, results };
}

// --- Rapport quotidien ---
function scheduleDaily() {
  const now = new Date();
  const next = new Date();
  next.setHours(REPORT_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next - now;
  console.log(`[Init] Prochain rapport quotidien dans ${Math.round(delay / 60000)} min`);

  setTimeout(async function dailyReport() {
    const uptime = Math.round((Date.now() - stats.startedAt.getTime()) / 3600000);
    const rate = stats.totalPings > 0 ? Math.round((stats.successPings / stats.totalPings) * 100) : 0;

    await sendTelegram(
      `📊 <b>Rapport Supabase Keep-Alive</b>\n\n` +
      `🕐 Uptime: ${uptime}h\n` +
      `📡 Pings: ${stats.totalPings} (✅ ${stats.successPings} / ❌ ${stats.failedPings})\n` +
      `📈 Taux de succès: ${rate}%\n` +
      `⏱ Dernier ping: ${stats.lastPing || 'aucun'}\n` +
      `${stats.lastStatus === 'OK' ? '✅' : '❌'} Statut: ${stats.lastStatus || 'inconnu'}\n` +
      (stats.lastError ? `🔴 Dernière erreur: ${stats.lastError}\n` : '') +
      `🔄 Restores: ${stats.restoreSuccesses}/${stats.restoreAttempts}` +
      (stats.lastRestore ? ` (dernier: ${stats.lastRestore})` : '') + `\n` +
      `🛡 Auto-restore: ${SUPABASE_ACCESS_TOKEN ? '✅ activé' : '❌ désactivé'}\n` +
      `\n⏰ Intervalle: toutes les ${PING_INTERVAL_MS / 3600000}h`
    );

    // Planifier le prochain
    setTimeout(dailyReport, 24 * 60 * 60 * 1000);
  }, delay);
}

// --- Main ---
(async () => {
  console.log('===========================================');
  console.log(' Supabase Keep-Alive Service');
  console.log(` Ping toutes les ${PING_INTERVAL_MS / 3600000}h`);
  console.log(` Rapport quotidien à ${REPORT_HOUR}h`);
  console.log(` Alertes Telegram vers: ${CHAT_IDS.join(', ')}`);
  console.log(` Auto-restore: ${SUPABASE_ACCESS_TOKEN ? 'ACTIVÉ' : 'DÉSACTIVÉ (token manquant)'}`);
  console.log('===========================================');

  // Premier ping immédiat
  const { allOk } = await pingSupabase();

  // Notification de démarrage
  await sendTelegram(
    `🟢 <b>Keep-Alive Supabase démarré</b>\n\n` +
    `📡 Premier ping: ${allOk ? '✅ OK' : '❌ ERREUR'}\n` +
    `⏰ Intervalle: toutes les ${PING_INTERVAL_MS / 3600000}h\n` +
    `📊 Rapport quotidien à ${REPORT_HOUR}h\n` +
    `🛡 Auto-restore: ${SUPABASE_ACCESS_TOKEN ? '✅ activé (après ' + RESTORE_AFTER_FAILURES + ' échecs)' : '❌ désactivé'}\n` +
    `🔔 Alertes en cas d'erreur`
  );

  // Ping périodique
  setInterval(() => pingSupabase(), PING_INTERVAL_MS);

  // Rapport quotidien
  scheduleDaily();

  // Garder le process vivant
  process.on('SIGINT', async () => {
    console.log('\n[Arrêt] Envoi notification...');
    await sendTelegram('🔴 <b>Keep-Alive Supabase arrêté</b> (SIGINT)');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await sendTelegram('🔴 <b>Keep-Alive Supabase arrêté</b> (SIGTERM)');
    process.exit(0);
  });
})();
