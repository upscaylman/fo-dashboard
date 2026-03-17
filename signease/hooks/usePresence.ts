/**
 * Hook de tracking de presence pour SignEase
 * Envoie les donnees vers Supabase (via Edge Function db-proxy) pour le dashboard TeamEase
 */

import { useCallback, useEffect, useRef } from 'react';

// Configuration Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://geljwonckfmdkaywaxly.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/db-proxy`;

const SESSION_STORAGE_KEY = 'signease_session_id';
const USER_UUID_STORAGE_KEY = 'signease_user_uuid';
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

const getOrCreateUserUUID = (email: string): string => {
  const storageKey = `${USER_UUID_STORAGE_KEY}_${email}`;
  let uuid = localStorage.getItem(storageKey);
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(storageKey, uuid);
  }
  return uuid;
};

const getDefaultAvatar = (email: string): string => {
  const seed = encodeURIComponent(email);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=f97316`;
};

const edgeRequest = async (payload: Record<string, unknown>): Promise<any> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

interface UsePresenceOptions {
  userEmail?: string | null;
}

export const usePresence = (options?: UsePresenceOptions) => {
  const userEmail = options?.userEmail;
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePresence = useCallback(async (page: string = 'signease') => {
    if (!userEmail) return;

    try {
      if (sessionIdRef.current) {
        const result = await edgeRequest({
          table: 'active_sessions',
          operation: 'update',
          data: {
            current_page: page,
            current_tool: 'signease',
            last_activity: new Date().toISOString(),
          },
          eq: { id: sessionIdRef.current },
        });

        if (!result || !result.data || result.data.length === 0) {
          sessionIdRef.current = null;
          localStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
          return;
        }
      }

      const userId = getOrCreateUserUUID(userEmail);

      await edgeRequest({
        table: 'active_sessions',
        operation: 'delete',
        deleteFilters: { user_id: userId },
      });

      const result = await edgeRequest({
        table: 'active_sessions',
        operation: 'insert',
        data: {
          user_id: userId,
          user_email: userEmail,
          user_name: userEmail.split('@')[0],
          avatar_url: getDefaultAvatar(userEmail),
          current_page: page,
          current_tool: 'signease',
          last_activity: new Date().toISOString(),
          started_at: new Date().toISOString(),
        },
      });

      if (result?.data?.[0]?.id) {
        sessionIdRef.current = result.data[0].id;
        localStorage.setItem(SESSION_STORAGE_KEY, result.data[0].id);
        // Session créée silencieusement
      }
    } catch (e) {
      console.warn('Presence SignEase error:', e);
    }
  }, [userEmail]);

  const removePresence = useCallback(async () => {
    if (sessionIdRef.current) {
      await edgeRequest({
        table: 'active_sessions',
        operation: 'delete',
        deleteFilters: { id: sessionIdRef.current },
      });
      sessionIdRef.current = null;
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!userEmail) {
      if (sessionIdRef.current) removePresence();
      return;
    }

    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) sessionIdRef.current = storedSessionId;

    // Différer le tracking initial pour ne pas bloquer le rendu
    const startPresence = () => {
      updatePresence('signease');
      heartbeatRef.current = setInterval(() => {
        updatePresence('signease');
      }, HEARTBEAT_INTERVAL_MS);
    };

    // Utiliser requestIdleCallback si disponible, sinon setTimeout
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(startPresence, { timeout: 5000 });
    } else {
      timeoutId = setTimeout(startPresence, 3000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updatePresence('signease');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

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
      if (idleId !== undefined && 'cancelIdleCallback' in window) (window as any).cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      removePresence();
    };
  }, [userEmail, updatePresence, removePresence]);

  return { updatePresence, removePresence };
};
