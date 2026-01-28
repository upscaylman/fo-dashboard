// Hook de tracking de présence pour SignEase
// Envoie les données vers Supabase pour le dashboard FO Metaux

import { useCallback, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';

// Clé pour stocker l'ID de session et l'UUID utilisateur
const SESSION_STORAGE_KEY = 'signease_session_id';
const USER_UUID_STORAGE_KEY = 'signease_user_uuid';

// Heartbeat: toutes les 30 secondes (réduit pour limiter les erreurs 503)
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

// Configuration retry pour erreurs temporaires (503, PGRST002)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Erreurs temporaires Supabase à ignorer silencieusement
const isTransientError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; status?: number };
  // PGRST002 = Schema cache error (temporaire)
  // 503 = Service Unavailable (temporaire)
  return (
    err.code === 'PGRST002' ||
    err.status === 503 ||
    err.message?.includes('503') ||
    err.message?.includes('Service Unavailable') ||
    err.message?.includes('schema cache')
  );
};

// Utilitaire: sleep avec backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Générer ou récupérer un UUID stable pour cet utilisateur
const getOrCreateUserUUID = (email: string): string => {
  const storageKey = `${USER_UUID_STORAGE_KEY}_${email}`;
  let uuid = localStorage.getItem(storageKey);
  
  if (!uuid) {
    // Générer un UUID v4
    uuid = crypto.randomUUID();
    localStorage.setItem(storageKey, uuid);
  }
  
  return uuid;
};

// Générer un avatar par défaut
const getDefaultAvatar = (email: string): string => {
  const seed = encodeURIComponent(email);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=f97316`;
};

interface UsePresenceOptions {
  userEmail?: string | null;
}

export const usePresence = (options?: UsePresenceOptions) => {
  const userEmail = options?.userEmail;
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false); // Évite les opérations en parallèle
  const retryCountRef = useRef(0);

  // Créer ou mettre à jour la session avec retry automatique
  const updatePresence = useCallback(async (page: string = 'signease') => {
    if (!userEmail || !supabase || !isSupabaseConfigured) return;
    
    // Éviter les appels en parallèle
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    const userId = getOrCreateUserUUID(userEmail);

    const executeWithRetry = async (attempt: number = 0): Promise<void> => {
      try {
        if (sessionIdRef.current) {
          // Mettre à jour la session existante
          const { error } = await supabase
            .from('active_sessions')
            .update({
              current_page: page,
              current_tool: 'signease',
              last_activity: new Date().toISOString()
            })
            .eq('id', sessionIdRef.current);
          
          if (error) {
            // Si la session n'existe plus, la recréer
            if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
              sessionIdRef.current = null;
              localStorage.removeItem(SESSION_STORAGE_KEY);
              return executeWithRetry(0); // Recréer la session
            }
            throw error;
          }
        } else {
          // Supprimer les anciennes sessions de cet utilisateur SignEase
          await supabase
            .from('active_sessions')
            .delete()
            .eq('user_id', userId);

          // Créer une nouvelle session
          const { data, error } = await supabase
            .from('active_sessions')
            .insert({
              user_id: userId,
              user_email: userEmail,
              user_name: userEmail.split('@')[0],
              avatar_url: getDefaultAvatar(userEmail),
              current_page: page,
              current_tool: 'signease',
              last_activity: new Date().toISOString(),
              started_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          
          if (data) {
            sessionIdRef.current = data.id;
            localStorage.setItem(SESSION_STORAGE_KEY, data.id);
            retryCountRef.current = 0; // Reset retry count on success
            console.log('✅ Session SignEase créée:', data.id);
          }
        }
        
        retryCountRef.current = 0; // Reset on success
        
      } catch (error) {
        // Erreurs temporaires (503, PGRST002) - retry silencieux
        if (isTransientError(error) && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          // Retry silencieux - pas de log pour éviter le spam console
          await sleep(delay);
          return executeWithRetry(attempt + 1);
        }
        
        // Après MAX_RETRIES ou erreur non-temporaire, log silencieux
        if (isTransientError(error)) {
          // Ne pas spammer la console avec les erreurs 503 répétées
          if (retryCountRef.current === 0) {
            console.warn('⚠️ Supabase temporairement indisponible pour active_sessions');
          }
          retryCountRef.current++;
        } else {
          console.error('❌ Erreur session SignEase:', error);
        }
      }
    };

    try {
      await executeWithRetry();
    } finally {
      isUpdatingRef.current = false;
    }
  }, [userEmail]);

  // Supprimer la session (avec gestion erreurs silencieuse)
  const removePresence = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) return;

    if (sessionIdRef.current) {
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('id', sessionIdRef.current);
        
        console.log('🔴 Session SignEase supprimée');
      } catch (error) {
        // Ignorer les erreurs temporaires lors de la suppression
        if (!isTransientError(error)) {
          console.error('Erreur suppression session:', error);
        }
      } finally {
        sessionIdRef.current = null;
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Initialiser la présence quand l'utilisateur se connecte
  useEffect(() => {
    if (!userEmail || !supabase || !isSupabaseConfigured) {
      // Si déconnexion, supprimer la session
      if (sessionIdRef.current) {
        removePresence();
      }
      return;
    }

    // Récupérer une session existante du localStorage
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      sessionIdRef.current = storedSessionId;
    }

    // Créer/mettre à jour la présence
    updatePresence('signease');

    // Heartbeat toutes les 15 secondes (plus réactif)
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence('signease');
    }, HEARTBEAT_INTERVAL_MS);

    // Nettoyer à la fermeture - utiliser XHR synchrone pour fiabilité
    const handleBeforeUnload = () => {
      if (sessionIdRef.current && supabase) {
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?id=eq.${sessionIdRef.current}`;
          const xhr = new XMLHttpRequest();
          xhr.open('DELETE', url, false); // synchrone
          xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY || '');
          xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`);
          xhr.send();
          console.log('🔴 Session SignEase supprimée (beforeunload)');
        } catch {
          // Ignorer
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Gérer les changements de visibilité
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // L'utilisateur est revenu, mettre à jour immédiatement
        updatePresence('signease');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Supprimer la session quand le composant est démonté
      removePresence();
    };
  }, [userEmail, updatePresence, removePresence]);

  return {
    updatePresence,
    removePresence
  };
};
