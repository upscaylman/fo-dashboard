/**
 * Configuration globale de l'application React
 * Contient les URLs des webhooks n8n et autres constantes
 */

// Récupérer les URLs depuis les variables d'environnement ou utiliser les valeurs par défaut
const getWebhookUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_URL) {
    return (window as any).ENV.WEBHOOK_URL;
  }
  return import.meta.env.VITE_WEBHOOK_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254';
};

const getWebhookEmailUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_EMAIL_URL) {
    return (window as any).ENV.WEBHOOK_EMAIL_URL;
  }
  return import.meta.env.VITE_WEBHOOK_EMAIL_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997';
};

const getWebhookPdfConvertUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_PDF_CONVERT_URL) {
    return (window as any).ENV.WEBHOOK_PDF_CONVERT_URL;
  }
  return import.meta.env.VITE_WEBHOOK_PDF_CONVERT_URL || 'https://dee-wakeful-succulently.ngrok-free.dev/api/convert-pdf';
};

const getWebhookAiImproveUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_AI_IMPROVE_URL) {
    return (window as any).ENV.WEBHOOK_AI_IMPROVE_URL;
  }
  // En local : appeler Ollama directement
  // En production : utiliser le webhook n8n
  return import.meta.env.VITE_WEBHOOK_AI_IMPROVE_URL || 'http://localhost:11434/api/generate';
};

export const CONFIG = {
  // URLs des webhooks n8n
  WEBHOOK_URL: getWebhookUrl(),
  WEBHOOK_EMAIL_URL: getWebhookEmailUrl(),
  WEBHOOK_PDF_CONVERT_URL: getWebhookPdfConvertUrl(),
  WEBHOOK_AI_IMPROVE_URL: getWebhookAiImproveUrl(),

  // Chemins
  VARIABLES_CONFIG_PATH: '/config/variables.json',

  // Timeouts
  REQUEST_TIMEOUT: 120000, // 2 minutes
  AI_REQUEST_TIMEOUT: 90000, // 1.5 minutes pour l'IA (plus lent)

  // Ollama
  OLLAMA_MODEL: 'gemma2:2b',

  // Limites
  MAX_PAYLOAD_SIZE: 8 * 1024 * 1024, // 8 MB max pour ngrok
};

/**
 * Obtenir l'URL AI dynamiquement (au moment de l'appel, pas de l'import)
 */
export const getAiWebhookUrl = (): string => {
  // Vérifier window.ENV en premier (production)
  if (typeof window !== 'undefined' && (window as any).ENV?.WEBHOOK_AI_IMPROVE_URL) {
    return (window as any).ENV.WEBHOOK_AI_IMPROVE_URL;
  }
  // Sinon, utiliser la valeur de config (déjà évaluée)
  return CONFIG.WEBHOOK_AI_IMPROVE_URL;
};

/**
 * Fetch avec timeout et AbortController
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = CONFIG.REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Créer les headers pour les requêtes HTTP
 */
export const createHeaders = (url: string, additionalHeaders: Record<string, string> = {}): HeadersInit => {
  const headers: Record<string, string> = {
    ...additionalHeaders
  };

  // Ajouter le header ngrok si nécessaire
  if (url.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return headers;
};

