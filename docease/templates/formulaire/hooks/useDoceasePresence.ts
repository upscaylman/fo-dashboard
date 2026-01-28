/**
 * Hook de présence pour DocEase
 * Gère le tracking en temps réel des utilisateurs sur DocEase
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

const SESSION_KEY = 'docease_session_id';
const HEARTBEAT_INTERVAL = 30000; // 30 secondes
const FETCH_TIMEOUT = 3000; // 3 secondes timeout pour éviter de bloquer

// Flag pour désactiver temporairement si Supabase est down
let supabaseAvailable = true;
let retryAfter = 0;

interface UseDoceasePresenceOptions {
  currentPage?: string;
  tool?: 'docease' | 'signease';
}

// Helper pour fetch avec timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response | null> => {
  // Si Supabase est marqué comme indisponible, ne pas essayer
  if (!supabaseAvailable && Date.now() < retryAfter) {
    return null;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Si on a une erreur 503/502, marquer Supabase comme indisponible pour 60s
    if (response.status === 503 || response.status === 502) {
      supabaseAvailable = false;
      retryAfter = Date.now() + 60000; // Réessayer dans 60 secondes
      return null;
    }
    
    // Supabase est disponible
    supabaseAvailable = true;
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    // Timeout ou erreur réseau - ne pas spammer
    return null;
  }
};

export const useDoceasePresence = (options: UseDoceasePresenceOptions = {}) => {
  const { user, isAuthenticated } = useDoceaseAuth();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<string | null>(null);

  const { currentPage = 'formulaire', tool = 'docease' } = options;

  // Mettre à jour la présence
  const updatePresence = useCallback(async (activity?: string) => {
    if (!isAuthenticated || !user) return;

    const sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) return;

    const updateData: Record<string, any> = {
      current_page: activity || currentPage,
      current_tool: tool,
      last_activity: new Date().toISOString()
    };

    // Stocker la dernière activité
    if (activity) {
      lastActivityRef.current = activity;
    }

    // Utiliser fetchWithTimeout pour ne pas bloquer
    await fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/active_sessions?id=eq.${sessionId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      },
      FETCH_TIMEOUT
    );
    // Pas de catch - on ignore silencieusement les erreurs
  }, [isAuthenticated, user, currentPage, tool]);

  // Enregistrer une activité (génération de document, téléchargement, etc.)
  const trackActivity = useCallback(async (
    activityType: 'generate' | 'download' | 'email_sent' | 'preview' | 'template_selected',
    metadata?: Record<string, any>
  ) => {
    if (!isAuthenticated || !user) return;

    // Mettre à jour la présence avec l'activité
    const activityPage = `${currentPage}:${activityType}`;
    await updatePresence(activityPage);

    // Optionnel: Enregistrer l'activité dans une table dédiée (pour historique)
    // Silencieux et non-bloquant
    fetchWithTimeout(
      `${SUPABASE_CONFIG.url}/rest/v1/docease_activities`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          activity_type: activityType,
          tool: tool,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })
      },
      FETCH_TIMEOUT
    );
    // Pas de catch - on ignore silencieusement les erreurs
  }, [isAuthenticated, user, currentPage, tool, updatePresence]);

  // Heartbeat pour maintenir la session active
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Premier update
    updatePresence();

    // Démarrer le heartbeat
    heartbeatRef.current = setInterval(() => {
      updatePresence(lastActivityRef.current || undefined);
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [isAuthenticated, user, updatePresence]);

  // Mettre à jour sur changement de visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updatePresence]);

  return {
    updatePresence,
    trackActivity
  };
};

export default useDoceasePresence;
