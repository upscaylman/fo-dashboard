/**
 * Hook de presence pour DocEase
 * Gere le tracking en temps reel des utilisateurs sur DocEase
 * Utilise Edge Function db-proxy (PostgREST 503 permanent)
 * 
 * NOTE: Ce tracking est 100% optionnel et non-bloquant
 * DocEase fonctionne sans Supabase - c'est juste pour le dashboard
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDoceaseAuth } from '../context/AuthContext';

// Configuration Supabase
const SUPABASE_CONFIG = {
  url: 'https://geljwonckfmdkaywaxly.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ'
};

const EDGE_FUNCTION_URL = `${SUPABASE_CONFIG.url}/functions/v1/db-proxy`;
const SESSION_KEY = 'docease_session_id';
const USER_UUID_KEY = 'docease_user_uuid';
const HEARTBEAT_INTERVAL = 60 * 1000; // 60 secondes

// Helper pour generer/recuperer un UUID stable
const getOrCreateUserUUID = (email: string): string => {
  const storageKey = `${USER_UUID_KEY}_${email}`;
  let uuid = localStorage.getItem(storageKey);
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(storageKey, uuid);
  }
  return uuid;
};

const getDefaultAvatar = (email: string): string => {
  const seed = encodeURIComponent(email);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=7c3aed`;
};

// Helper pour appeler l'Edge Function db-proxy
const edgeRequest = async (payload: Record<string, unknown>): Promise<any> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'apikey': SUPABASE_CONFIG.anonKey,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

interface UseDoceasePresenceOptions {
  currentPage?: string;
  tool?: 'docease' | 'signease';
}

export const useDoceasePresence = (options: UseDoceasePresenceOptions = {}) => {
  const { user, isAuthenticated } = useDoceaseAuth();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<string | null>(null);

  const { currentPage = 'formulaire', tool = 'docease' } = options;

  // Mettre a jour la presence
  const updatePresence = useCallback(async (activity?: string) => {
    if (!isAuthenticated || !user) return;

    try {
      if (sessionIdRef.current) {
        // UPDATE session existante
        const result = await edgeRequest({
          table: 'active_sessions',
          operation: 'update',
          data: {
            current_page: activity || currentPage,
            current_tool: tool,
            last_activity: new Date().toISOString(),
          },
          eq: { id: sessionIdRef.current },
        });

        if (activity) lastActivityRef.current = activity;

        if (!result || !result.data || result.data.length === 0) {
          sessionIdRef.current = null;
          localStorage.removeItem(SESSION_KEY);
        } else {
          return;
        }
      }

      // Pas de session -> en creer une
      const userId = user.id || getOrCreateUserUUID(user.email || 'unknown');
      const userEmail = user.email || 'unknown';

      // Supprimer les anciennes sessions de cet utilisateur
      await edgeRequest({
        table: 'active_sessions',
        operation: 'delete',
        deleteFilters: { user_id: userId },
      });

      // Creer nouvelle session
      const result = await edgeRequest({
        table: 'active_sessions',
        operation: 'insert',
        data: {
          user_id: userId,
          user_email: userEmail,
          user_name: user.name || userEmail.split('@')[0],
          avatar_url: getDefaultAvatar(userEmail),
          current_page: activity || currentPage,
          current_tool: tool,
          last_activity: new Date().toISOString(),
          started_at: new Date().toISOString(),
        },
      });

      if (result?.data?.[0]?.id) {
        sessionIdRef.current = result.data[0].id;
        localStorage.setItem(SESSION_KEY, result.data[0].id);
        console.log('DocEase session created:', result.data[0].id);
      }
    } catch (e) {
      // Silencieux - ne pas bloquer DocEase
    }
  }, [isAuthenticated, user, currentPage, tool]);

  // Enregistrer une activite
  const trackActivity = useCallback((
    activityType: string,
    _metadata?: Record<string, any>
  ) => {
    if (!isAuthenticated || !user) return;
    const activityPage = `${currentPage}:${activityType}`;
    updatePresence(activityPage);
  }, [isAuthenticated, user, currentPage, updatePresence]);

  // Heartbeat pour maintenir la session active
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Recuperer session existante
    const storedSessionId = localStorage.getItem(SESSION_KEY);
    if (storedSessionId) sessionIdRef.current = storedSessionId;

    // Premier update
    updatePresence();

    // Heartbeat
    heartbeatRef.current = setInterval(() => {
      updatePresence(lastActivityRef.current || undefined);
    }, HEARTBEAT_INTERVAL);

    // Visibilite
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updatePresence();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup a la fermeture (best effort via sendBeacon)
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        const payload = JSON.stringify({
          table: 'active_sessions',
          operation: 'delete',
          deleteFilters: { id: sessionIdRef.current },
        });
        navigator.sendBeacon?.(EDGE_FUNCTION_URL, new Blob([payload], { type: 'application/json' }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Supprimer la session au demontage
      if (sessionIdRef.current) {
        edgeRequest({
          table: 'active_sessions',
          operation: 'delete',
          deleteFilters: { id: sessionIdRef.current },
        }).catch(() => {});
        sessionIdRef.current = null;
        localStorage.removeItem(SESSION_KEY);
      }
    };
  }, [isAuthenticated, user, updatePresence]);

  return { updatePresence, trackActivity };
};

export default useDoceasePresence;
