/**
 * Supabase Resilience Layer
 * 
 * Gère la résilience des connexions à Supabase:
 * - Startup gate: attend que le service soit prêt avant de faire des requêtes
 * - Rate limiting: limite le nombre de requêtes simultanées
 * - Backoff: pause automatique en cas d'erreur 503
 */

import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';

// ========================================================
// EDGE FUNCTION FALLBACK CONFIGURATION
// ========================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/db-proxy`;

// FORCÉ: PostgREST est en 503, utiliser Edge Function directement
let useEdgeFunctionFallback = true;
let edgeFunctionFailures = 0;
const MAX_EDGE_FAILURES = 3;

/**
 * Appelle l'Edge Function db-proxy comme fallback
 */
export const queryViaEdgeFunction = async <T>(
  table: string,
  options: {
    select?: string;
    filters?: Record<string, unknown>;
    limit?: number;
    countOnly?: boolean;
    gte?: Record<string, unknown>;
    lt?: Record<string, unknown>;
    eq?: Record<string, unknown>;
    orderBy?: string;
    orderDesc?: boolean;
  } = {}
): Promise<{ data: T | null; error: Error | null; count?: number }> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        table,
        select: options.select || '*',
        filters: options.filters,
        limit: options.limit,
        countOnly: options.countOnly,
        gte: options.gte,
        lt: options.lt,
        eq: options.eq,
        orderBy: options.orderBy,
        orderDesc: options.orderDesc,
      }),
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    edgeFunctionFailures = 0; // Reset on success
    return { data: result.data as T, error: null, count: result.count };
  } catch (error) {
    edgeFunctionFailures++;
    console.error('Edge function fallback failed:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Vérifie si on doit utiliser l'Edge Function fallback
 */
export const shouldUseEdgeFallback = (): boolean => {
  return useEdgeFunctionFallback && edgeFunctionFailures < MAX_EDGE_FAILURES;
};

/**
 * INSERT via Edge Function
 */
export const insertViaEdgeFunction = async <T>(
  table: string,
  data: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        table,
        operation: 'insert',
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Edge function INSERT error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    edgeFunctionFailures = 0;
    return { data: result.data as T, error: null };
  } catch (error) {
    edgeFunctionFailures++;
    console.error('Edge function INSERT failed:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * DELETE via Edge Function
 */
export const deleteViaEdgeFunction = async (
  table: string,
  filters: Record<string, unknown>
): Promise<{ error: Error | null }> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        table,
        operation: 'delete',
        deleteFilters: filters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Edge function DELETE error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    edgeFunctionFailures = 0;
    return { error: null };
  } catch (error) {
    edgeFunctionFailures++;
    console.error('Edge function DELETE failed:', error);
    return { error: error as Error };
  }
};

/**
 * Active le mode Edge Function fallback
 */
export const enableEdgeFallback = (): void => {
  useEdgeFunctionFallback = true;
  console.log('🔄 Edge Function fallback activé');
};

/**
 * Désactive le mode Edge Function fallback
 */
export const disableEdgeFallback = (): void => {
  useEdgeFunctionFallback = false;
  edgeFunctionFailures = 0;
  console.log('✅ Edge Function fallback désactivé - PostgREST OK');
};

// ========================================================
// STARTUP GATE - Empêche les requêtes tant que le service n'est pas prêt
// ========================================================
let serviceReady = false;
let startupCheckInProgress = false;
let startupPromise: Promise<boolean> | null = null;
let lastSuccessfulRequest = 0;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 30000;

/**
 * Vérifie si Supabase est prêt avec une requête simple
 * FORCÉ: Utilise directement Edge Function car PostgREST est en 503
 */
const checkServiceReady = async (): Promise<boolean> => {
  try {
    // Utiliser directement Edge Function car PostgREST est cassé
    const edgeResult = await queryViaEdgeFunction('users', { select: 'id', limit: 1 });
    
    if (!edgeResult.error) {
      serviceReady = true;
      consecutiveErrors = 0;
      lastSuccessfulRequest = Date.now();
      console.log('✅ Edge Function ready');
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

/**
 * Attend que le service soit prêt (appelé au démarrage)
 */
export const waitForServiceReady = async (): Promise<boolean> => {
  if (serviceReady) return true;
  
  if (startupCheckInProgress && startupPromise) {
    return startupPromise;
  }
  
  startupCheckInProgress = true;
  startupPromise = (async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const ready = await checkServiceReady();
      if (ready) {
        startupCheckInProgress = false;
        return true;
      }
      
      attempts++;
      const delay = Math.min(BACKOFF_BASE_MS * attempts, BACKOFF_MAX_MS);
      console.log(`Supabase not ready, retry in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, delay));
    }
    
    startupCheckInProgress = false;
    console.warn('Supabase service unavailable after max attempts');
    return false;
  })();
  
  return startupPromise;
};

/**
 * Vérifie si le service est en backoff (trop d'erreurs récentes)
 */
export const isInBackoff = (): boolean => {
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    const backoffTime = Math.min(BACKOFF_BASE_MS * Math.pow(2, consecutiveErrors - MAX_CONSECUTIVE_ERRORS), BACKOFF_MAX_MS);
    const timeSinceLastRequest = Date.now() - lastSuccessfulRequest;
    return timeSinceLastRequest < backoffTime;
  }
  return false;
};

/**
 * Vérifie si une erreur est temporaire (503, 502, PGRST002)
 */
export const isTransientError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as PostgrestError & { status?: number };
  
  if (err.code === 'PGRST002') return true;
  if (err.code === 'PGRST003') return true;
  if (err.status === 503) return true;
  if (err.status === 502) return true;
  if (err.status === 504) return true;
  if (err.status === 429) return true;
  
  const message = err.message?.toLowerCase() || '';
  if (message.includes('503')) return true;
  if (message.includes('service unavailable')) return true;
  
  return false;
};

/**
 * Circuit breaker basé sur le nombre d'erreurs consécutives
 */
export const isCircuitOpen = (): boolean => isInBackoff();

/**
 * Enregistre une requête réussie
 */
export const recordSuccess = (): void => {
  consecutiveErrors = 0;
  lastSuccessfulRequest = Date.now();
  serviceReady = true;
};

/**
 * Enregistre un échec
 */
export const recordFailure = (error?: unknown): void => {
  consecutiveErrors++;
  if (isTransientError(error)) {
    console.warn(`Supabase 503 error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`);
  }
};

/**
 * Vérifie si le service est sain
 */
export const isServiceHealthy = (): boolean => !isInBackoff() && serviceReady;

/**
 * Vérifie la santé de Supabase
 */
export const probeSupabaseHealth = async (): Promise<boolean> => checkServiceReady();

/**
 * Exécute une requête avec retry et backoff
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> => {
  // Attendre que le service soit prêt au premier appel
  await waitForServiceReady();
  
  // Si en backoff, attendre
  if (isInBackoff()) {
    const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, consecutiveErrors - MAX_CONSECUTIVE_ERRORS), BACKOFF_MAX_MS);
    console.log(`Service in backoff, waiting ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
  }
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      recordSuccess();
      return result;
    } catch (error) {
      lastError = error;
      recordFailure(error);
      
      if (attempt < maxRetries && isTransientError(error)) {
        const delay = BACKOFF_BASE_MS * (attempt + 1);
        console.log(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Réinitialiser le système de résilience
 */
export const resetCircuitBreaker = (): void => {
  serviceReady = false;
  consecutiveErrors = 0;
  lastSuccessfulRequest = 0;
  startupPromise = null;
  startupCheckInProgress = false;
};

/**
 * État du circuit breaker
 */
export const getCircuitBreakerState = () => ({
  state: isInBackoff() ? 'open' as const : 'closed' as const,
  consecutiveFailures: consecutiveErrors,
  lastFailureTime: lastSuccessfulRequest,
  serviceHealthy: serviceReady && !isInBackoff()
});

/**
 * Vérifie une erreur Supabase - no-op
 */
export const handleSupabaseError = (error: unknown): boolean => {
  if (error) console.warn('Supabase error:', error);
  return false;
};

/**
 * withRetry avec gestion du backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    silent?: boolean;
    context?: string;
    fallback?: T;
  } = {}
): Promise<T | null> {
  const { maxRetries = 2, fallback = null, silent = false, context = '' } = options;
  
  // Si en backoff, retourner le fallback immédiatement
  if (isInBackoff()) {
    if (!silent) console.log(`${context}: Skipped (service in backoff)`);
    return fallback as T | null;
  }
  
  try {
    const result = await executeWithRetry(fn, maxRetries);
    return result;
  } catch (e) {
    if (!silent) console.error(`${context}: Failed after retries:`, e);
    return fallback as T | null;
  }
}

/**
 * safeQuery avec gestion du backoff et Edge Function fallback
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: {
    silent?: boolean;
    context?: string;
    fallback?: T;
    // Options pour Edge Function fallback
    edgeFallback?: {
      table: string;
      select?: string;
      filters?: Record<string, unknown>;
      limit?: number;
    };
  } = {}
): Promise<{ data: T | null; error: PostgrestError | null; fromFallback: boolean; viaEdgeFunction: boolean }> {
  const { fallback = null, silent = false, context = '', edgeFallback } = options;
  
  // Si en backoff, retourner le fallback
  if (isInBackoff()) {
    if (!silent) console.log(`${context}: Skipped (service in backoff)`);
    return { data: fallback, error: null, fromFallback: true, viaEdgeFunction: false };
  }
  
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      recordFailure(error);
      
      // Si erreur 503 et Edge fallback configuré, essayer l'Edge Function
      if (isTransientError(error) && edgeFallback && shouldUseEdgeFallback()) {
        if (!silent) console.log(`${context}: PostgREST failed, trying Edge Function...`);
        
        const edgeResult = await queryViaEdgeFunction<T>(
          edgeFallback.table,
          {
            select: edgeFallback.select,
            filters: edgeFallback.filters,
            limit: edgeFallback.limit,
          }
        );
        
        if (!edgeResult.error && edgeResult.data) {
          recordSuccess();
          return { data: edgeResult.data, error: null, fromFallback: false, viaEdgeFunction: true };
        }
      }
      
      if (isTransientError(error)) {
        return { data: fallback, error, fromFallback: true, viaEdgeFunction: false };
      }
    } else {
      recordSuccess();
      // PostgREST fonctionne, désactiver le fallback si actif
      if (useEdgeFunctionFallback) {
        disableEdgeFallback();
      }
    }
    
    return { data, error, fromFallback: false, viaEdgeFunction: false };
  } catch (error) {
    recordFailure(error);
    
    // Tenter Edge Function en dernier recours
    if (edgeFallback && shouldUseEdgeFallback()) {
      const edgeResult = await queryViaEdgeFunction<T>(
        edgeFallback.table,
        {
          select: edgeFallback.select,
          filters: edgeFallback.filters,
          limit: edgeFallback.limit,
        }
      );
      
      if (!edgeResult.error && edgeResult.data) {
        return { data: edgeResult.data, error: null, fromFallback: false, viaEdgeFunction: true };
      }
    }
    
    return { 
      data: fallback, 
      error: error as PostgrestError, 
      fromFallback: true,
      viaEdgeFunction: false
    };
  }
}

/**
 * Status de connexion
 */
export const getConnectionStatus = () => ({
  isHealthy: serviceReady && !isInBackoff(),
  circuitState: isInBackoff() ? 'open' as const : 'closed' as const,
  failureCount: consecutiveErrors,
  serviceReady,
  usingEdgeFallback: useEdgeFunctionFallback,
  edgeFunctionFailures: edgeFunctionFailures
});
