// Hook de tracking de présence pour SignEase
// Envoie les données vers Supabase pour le dashboard FO Metaux

import { useCallback, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';

// Clé pour stocker l'ID de session et l'UUID utilisateur
const SESSION_STORAGE_KEY = 'signease_session_id';
const USER_UUID_STORAGE_KEY = 'signease_user_uuid';

// Heartbeat: toutes les 15 secondes (plus réactif)
const HEARTBEAT_INTERVAL_MS = 15 * 1000;

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

  // Créer ou mettre à jour la session
  const updatePresence = useCallback(async (page: string = 'signease') => {
    if (!userEmail || !supabase || !isSupabaseConfigured) return;

    const userId = getOrCreateUserUUID(userEmail);

    try {
      if (sessionIdRef.current) {
        // Mettre à jour la session existante
        await supabase
          .from('active_sessions')
          .update({
            current_page: page,
            current_tool: 'signease',
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionIdRef.current);
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

        if (!error && data) {
          sessionIdRef.current = data.id;
          localStorage.setItem(SESSION_STORAGE_KEY, data.id);
          console.log('✅ Session SignEase créée:', data.id);
        } else if (error) {
          console.error('❌ Erreur création session:', error);
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour présence:', error);
    }
  }, [userEmail]);

  // Supprimer la session
  const removePresence = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) return;

    if (sessionIdRef.current) {
      await supabase
        .from('active_sessions')
        .delete()
        .eq('id', sessionIdRef.current);
      
      sessionIdRef.current = null;
      localStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('🔴 Session SignEase supprimée');
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
