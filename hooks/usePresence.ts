import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ========================================================
// PRESENCE SYSTEM - TEMPORAIREMENT DESACTIVE
// Cause: Surcharge PostgREST avec requetes excessives
// Date: 2026-02-02
// TODO: Reactivier apres optimisation Supabase
// ========================================================
const PRESENCE_DISABLED = true;

export interface ActiveUser {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  avatar_url?: string;
  current_page: string;
  current_tool?: 'docease' | 'signease' | null;
  last_activity: string;
  started_at: string;
  // Champs enrichis pour la fusion multi-outils
  tools?: ('dashboard' | 'docease' | 'signease')[];
  names?: string[];
}

interface UsePresenceReturn {
  activeUsers: ActiveUser[];
  isOnline: boolean;
  updatePresence: (page?: string, tool?: 'docease' | 'signease' | null) => Promise<void>;
  loading: boolean;
  serviceHealthy: boolean;
}

// Version desactivee du hook
const usePresenceDisabled = (): UsePresenceReturn => {
  return {
    activeUsers: [],
    isOnline: false,
    updatePresence: async () => {},
    loading: false,
    serviceHealthy: true
  };
};

// Clé pour stocker l'ID de session dans le localStorage
const SESSION_STORAGE_KEY = 'dashboard_session_id';

// Timeout d'inactivité: 90 secondes (augmenté pour réduire les faux positifs)
const INACTIVITY_TIMEOUT_MS = 90 * 1000;

// Heartbeat: toutes les 60 secondes (réduit drastiquement)
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

// Rafraîchissement liste: toutes les 45 secondes (réduit drastiquement)
const REFRESH_INTERVAL_MS = 45 * 1000;

// Configuration retry pour erreurs temporaires (503, PGRST002)
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 2000;

// Debounce pour éviter les appels multiples
const DEBOUNCE_MS = 2000;

// Utilitaire: sleep avec backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Stub functions quand disabled
const isCircuitOpen = () => false;
const recordSuccess = () => {};
const recordFailure = (_: any) => {};
const isTransientError = (_: any) => false;
const probeSupabaseHealth = async () => true;

const usePresenceEnabled = (): UsePresenceReturn => {
  const { user, isImpersonating } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializingRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyer les anciennes sessions de cet utilisateur (silencieux, best effort)
  const cleanupOldSessions = useCallback(async (userId: string, keepSessionId?: string) => {
    // Skip si circuit ouvert
    if (isCircuitOpen()) return;
    
    try {
      let query = supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);
      
      if (keepSessionId) {
        query = query.neq('id', keepSessionId);
      }
      
      await query;
      recordSuccess();
    } catch (error) {
      if (isTransientError(error)) {
        recordFailure(error);
      }
      // Ignorer silencieusement - pas critique
    }
  }, []);

  // Créer ou mettre à jour la session avec retry automatique
  const updatePresence = useCallback(async (
    page: string = 'dashboard',
    tool: 'docease' | 'signease' | null = null
  ) => {
    // Ne pas créer de session en mode impersonation ou si circuit ouvert
    if (!user || isImpersonating || isCircuitOpen()) return;
    
    // Éviter les appels en parallèle
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    const executeWithRetry = async (attempt: number = 0): Promise<void> => {
      try {
        // Récupérer le nom et l'avatar de l'utilisateur (optionnel)
        let userData = { name: null as string | null, avatar: null as string | null };
        try {
          const { data, error } = await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', user.id)
            .single();
          if (data) userData = data;
          if (!error) recordSuccess();
        } catch (e) {
          if (isTransientError(e)) recordFailure(e);
        }

        if (sessionIdRef.current) {
          // Mettre à jour la session existante
          const { error } = await supabase
            .from('active_sessions')
            .update({
              current_page: page,
              current_tool: tool,
              last_activity: new Date().toISOString(),
              user_name: userData?.name || null,
              avatar_url: userData?.avatar || null
            })
            .eq('id', sessionIdRef.current);
          
          if (error) {
            if (isTransientError(error)) {
              recordFailure(error);
              if (attempt < MAX_RETRIES && !isCircuitOpen()) {
                await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
                return executeWithRetry(attempt + 1);
              }
            }
            // Session expirée ou erreur - recréer
            sessionIdRef.current = null;
            localStorage.removeItem(SESSION_STORAGE_KEY);
          } else {
            recordSuccess();
          }
        }
        
        // Créer une nouvelle session si nécessaire
        if (!sessionIdRef.current && !isCircuitOpen()) {
          // Supprimer toutes les anciennes sessions de cet utilisateur
          await cleanupOldSessions(user.id);

          // Créer une nouvelle session
          const { data, error } = await supabase
            .from('active_sessions')
            .insert({
              user_id: user.id,
              user_email: user.email || 'unknown',
              user_name: userData?.name || null,
              avatar_url: userData?.avatar || null,
              current_page: page,
              current_tool: tool,
              last_activity: new Date().toISOString(),
              started_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!error && data) {
            sessionIdRef.current = data.id;
            localStorage.setItem(SESSION_STORAGE_KEY, data.id);
            setIsOnline(true);
            recordSuccess();
          } else if (error) {
            if (isTransientError(error)) {
              recordFailure(error);
              if (attempt < MAX_RETRIES && !isCircuitOpen()) {
                await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
                return executeWithRetry(attempt + 1);
              }
            }
          }
        }
      } catch (error) {
        if (isTransientError(error)) {
          recordFailure(error);
          if (attempt < MAX_RETRIES && !isCircuitOpen()) {
            await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
            return executeWithRetry(attempt + 1);
          }
        }
      }
    };

    try {
      await executeWithRetry();
    } finally {
      isUpdatingRef.current = false;
    }
  }, [user, isImpersonating, cleanupOldSessions]);

  // Supprimer la session (silencieux)
  const removePresence = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('id', sessionIdRef.current);
      } catch {
        // Ignorer silencieusement
      }
      
      sessionIdRef.current = null;
      setIsOnline(false);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  // Récupérer les utilisateurs actifs avec debounce et protection circuit breaker
  const fetchActiveUsers = useCallback(async (force: boolean = false) => {
    // Éviter les appels trop fréquents (debounce)
    const now = Date.now();
    if (!force && now - lastFetchRef.current < DEBOUNCE_MS) {
      return;
    }
    lastFetchRef.current = now;
    
    // Skip si circuit ouvert
    if (isCircuitOpen()) {
      setLoading(false);
      return;
    }

    // Vérifier la santé du service avec probe centralisée
    const isHealthy = await probeSupabaseHealth();
    if (!isHealthy) {
      setLoading(false);
      return;
    }

    try {
      // Nettoyer les sessions inactives (best effort)
      const timeoutAgo = new Date(Date.now() - INACTIVITY_TIMEOUT_MS).toISOString();
      
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .lt('last_activity', timeoutAgo);
        recordSuccess();
      } catch (e) {
        if (isTransientError(e)) recordFailure(e);
      }

      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .gte('last_activity', timeoutAgo)
        .order('last_activity', { ascending: false });

      if (!error && data) {
        recordSuccess();
        
        // Dédupliquer par email - fusionner les outils et pseudos
        const emailMap = new Map<string, ActiveUser>();
        
        data.forEach((session: ActiveUser) => {
          const emailKey = session.user_email.toLowerCase().trim();
          const existing = emailMap.get(emailKey);
          
          const sessionTool: 'dashboard' | 'docease' | 'signease' = 
            session.current_tool === 'docease' ? 'docease' :
            session.current_tool === 'signease' ? 'signease' : 'dashboard';
          
          if (!existing) {
            emailMap.set(emailKey, {
              ...session,
              tools: [sessionTool],
              names: session.user_name ? [session.user_name] : []
            });
          } else {
            // Fusionner les outils
            if (!existing.tools?.includes(sessionTool)) {
              existing.tools = [...(existing.tools || []), sessionTool];
            }
            
            // Ajouter le pseudo si différent
            if (session.user_name) {
              const existingNames = existing.names || [];
              const nameExists = existingNames.some(
                n => n.toLowerCase().trim() === session.user_name!.toLowerCase().trim()
              );
              if (!nameExists) {
                existing.names = [...existingNames, session.user_name];
              }
            }
            
            // Garder l'activité la plus récente
            if (new Date(session.last_activity) > new Date(existing.last_activity)) {
              existing.last_activity = session.last_activity;
              existing.current_page = session.current_page;
              if (session.avatar_url) {
                existing.avatar_url = session.avatar_url;
              }
            }
          }
        });
        
        setActiveUsers(Array.from(emailMap.values()));
      } else if (error && isTransientError(error)) {
        recordFailure(error);
        // Silencieux - erreur temporaire
      }
    } catch (e) {
      if (isTransientError(e)) recordFailure(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refs pour éviter les re-créations de channels
  const fetchActiveUsersRef = useRef(fetchActiveUsers);
  fetchActiveUsersRef.current = fetchActiveUsers;

  // Debounced fetch pour événements realtime - stable
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchActiveUsersRef.current(false);
    }, DEBOUNCE_MS);
  }, []); // Pas de dépendances = fonction stable

  // Initialisation
  useEffect(() => {
    // Charger les utilisateurs actifs au démarrage
    fetchActiveUsers(true);
    
    // Rafraîchir la liste périodiquement (intervalle long)
    refreshIntervalRef.current = setInterval(() => {
      fetchActiveUsersRef.current(false);
    }, REFRESH_INTERVAL_MS);
    
    // Souscription realtime avec debounce
    const publicChannel = supabase
      .channel('presence-realtime-public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        () => {
          // Utiliser debounce pour éviter les rafales
          debouncedFetch();
        }
      )
      .subscribe();

    if (!user) {
      setLoading(false);
      return () => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        supabase.removeChannel(publicChannel);
      };
    }

    if (isImpersonating) {
      setLoading(false);
      return () => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        supabase.removeChannel(publicChannel);
      };
    }

    if (initializingRef.current) return;
    initializingRef.current = true;

    const initSession = async () => {
      // Skip si circuit ouvert
      if (isCircuitOpen()) {
        setLoading(false);
        return;
      }

      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (storedSessionId) {
        try {
          const { data: existingSession, error } = await supabase
            .from('active_sessions')
            .select('id, user_id')
            .eq('id', storedSessionId)
            .eq('user_id', user.id)
            .single();
          
          if (!error && existingSession) {
            sessionIdRef.current = storedSessionId;
            setIsOnline(true);
            recordSuccess();
            await supabase
              .from('active_sessions')
              .update({ last_activity: new Date().toISOString() })
              .eq('id', storedSessionId);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            await updatePresence('dashboard');
          }
        } catch (e) {
          if (isTransientError(e)) recordFailure(e);
          localStorage.removeItem(SESSION_STORAGE_KEY);
          // Attendre avant de réessayer
          setTimeout(() => updatePresence('dashboard'), 3000);
        }
      } else {
        await updatePresence('dashboard');
      }
      
      setLoading(false);
    };

    initSession();

    // Heartbeat avec intervalle long
    heartbeatIntervalRef.current = setInterval(async () => {
      if (sessionIdRef.current && !isCircuitOpen()) {
        try {
          const { error } = await supabase
            .from('active_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', sessionIdRef.current);
          
          if (error) {
            if (isTransientError(error)) {
              recordFailure(error);
            } else {
              // Session expirée, recréer après délai
              sessionIdRef.current = null;
              localStorage.removeItem(SESSION_STORAGE_KEY);
              setTimeout(() => updatePresence('dashboard'), 2000);
            }
          } else {
            recordSuccess();
          }
        } catch (e) {
          if (isTransientError(e)) recordFailure(e);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Nettoyage à la fermeture de page
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Utiliser XHR synchrone pour suppression fiable
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?id=eq.${sessionIdRef.current}`;
        
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('DELETE', url, false);
          xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
          xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
          xhr.send();
        } catch {
          // Ignorer
        }
      }
    };

    // Gérer les changements de visibilité avec debounce
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && sessionIdRef.current && !isCircuitOpen()) {
        // Attendre un peu avant de mettre à jour
        setTimeout(async () => {
          try {
            const { error } = await supabase
              .from('active_sessions')
              .update({ last_activity: new Date().toISOString() })
              .eq('id', sessionIdRef.current);
            if (!error) recordSuccess();
            else if (isTransientError(error)) recordFailure(error);
          } catch (e) {
            if (isTransientError(e)) recordFailure(e);
          }
        }, 500);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      removePresence();
      supabase.removeChannel(publicChannel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      initializingRef.current = false;
    };
  }, [user?.id, isImpersonating, debouncedFetch]); // Dépendances minimales et stables

  return {
    activeUsers,
    isOnline,
    updatePresence,
    loading,
    serviceHealthy: true
  };
};

// Export conditionnel selon l'etat du systeme
export const usePresence = PRESENCE_DISABLED ? usePresenceDisabled : usePresenceEnabled;
export default usePresence;