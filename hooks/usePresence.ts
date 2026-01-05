import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
}

// Clé pour stocker l'ID de session dans le localStorage
const SESSION_STORAGE_KEY = 'dashboard_session_id';

// Timeout d'inactivité: 45 secondes (détection rapide)
const INACTIVITY_TIMEOUT_MS = 45 * 1000;

// Heartbeat: toutes les 15 secondes (plus réactif)
const HEARTBEAT_INTERVAL_MS = 15 * 1000;

// Rafraîchissement liste: toutes les 10 secondes
const REFRESH_INTERVAL_MS = 10 * 1000;

export const usePresence = (): UsePresenceReturn => {
  const { user, isImpersonating } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);

  // Nettoyer les anciennes sessions de cet utilisateur
  const cleanupOldSessions = useCallback(async (userId: string, keepSessionId?: string) => {
    try {
      let query = supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);
      
      if (keepSessionId) {
        query = query.neq('id', keepSessionId);
      }
      
      await query;
    } catch (error) {
      // Ignorer silencieusement
    }
  }, []);

  // Créer ou mettre à jour la session
  const updatePresence = useCallback(async (
    page: string = 'dashboard',
    tool: 'docease' | 'signease' | null = null
  ) => {
    // Ne pas créer de session en mode impersonation
    if (!user || isImpersonating) return;

    try {
      // Récupérer le nom et l'avatar de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', user.id)
        .single();

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
          // Session expirée, en recréer une
          sessionIdRef.current = null;
          localStorage.removeItem(SESSION_STORAGE_KEY);
          await updatePresence(page, tool);
        }
      } else {
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
          console.log('✅ Session dashboard créée:', data.id);
        }
      }
    } catch (error) {
      console.error('Erreur updatePresence:', error);
    }
  }, [user, isImpersonating, cleanupOldSessions]);

  // Supprimer la session
  const removePresence = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('id', sessionIdRef.current);
        console.log('🔴 Session dashboard supprimée:', sessionIdRef.current);
      } catch {
        // Ignorer
      }
      
      sessionIdRef.current = null;
      setIsOnline(false);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  // Récupérer les utilisateurs actifs (dédupliqués par email)
  const fetchActiveUsers = useCallback(async () => {
    try {
      // Nettoyer les sessions inactives (plus de 45 secondes sans activité)
      const timeoutAgo = new Date(Date.now() - INACTIVITY_TIMEOUT_MS).toISOString();
      
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .lt('last_activity', timeoutAgo);
      } catch {
        // Ignorer
      }

      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .gte('last_activity', timeoutAgo)
        .order('last_activity', { ascending: false });

      if (!error && data) {
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
      }
    } catch (error) {
      console.error('Erreur fetchActiveUsers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialisation
  useEffect(() => {
    // Toujours charger les utilisateurs actifs
    fetchActiveUsers();
    
    // Rafraîchir la liste fréquemment pour détecter les déconnexions rapides
    const refreshInterval = setInterval(() => {
      fetchActiveUsers();
    }, REFRESH_INTERVAL_MS);
    
    // Souscription realtime pour mise à jour instantanée
    const publicChannel = supabase
      .channel('presence-realtime-public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        (payload) => {
          console.log('📡 Presence change:', payload.eventType);
          // Rafraîchir immédiatement
          fetchActiveUsers();
        }
      )
      .subscribe((status) => {
        console.log('📡 Presence subscription status:', status);
      });

    if (!user) {
      setLoading(false);
      return () => {
        clearInterval(refreshInterval);
        supabase.removeChannel(publicChannel);
      };
    }

    if (isImpersonating) {
      setLoading(false);
      return () => {
        clearInterval(refreshInterval);
        supabase.removeChannel(publicChannel);
      };
    }

    if (initializingRef.current) return;
    initializingRef.current = true;

    const initSession = async () => {
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (storedSessionId) {
        try {
          const { data: existingSession } = await supabase
            .from('active_sessions')
            .select('id, user_id')
            .eq('id', storedSessionId)
            .eq('user_id', user.id)
            .single();
          
          if (existingSession) {
            sessionIdRef.current = storedSessionId;
            setIsOnline(true);
            await supabase
              .from('active_sessions')
              .update({ last_activity: new Date().toISOString() })
              .eq('id', storedSessionId);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            await updatePresence('dashboard');
          }
        } catch {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          await updatePresence('dashboard');
        }
      } else {
        await updatePresence('dashboard');
      }
      
      await fetchActiveUsers();
    };

    initSession();

    // Heartbeat plus fréquent (15 secondes)
    heartbeatIntervalRef.current = setInterval(async () => {
      if (sessionIdRef.current) {
        try {
          const { error } = await supabase
            .from('active_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', sessionIdRef.current);
          
          if (error) {
            // Session expirée, recréer
            sessionIdRef.current = null;
            localStorage.removeItem(SESSION_STORAGE_KEY);
            await updatePresence('dashboard');
          }
        } catch {
          // Ignorer
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
          // Fallback ignoré
        }
      }
    };

    // Gérer les changements de visibilité
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && sessionIdRef.current) {
        // L'utilisateur est revenu, mettre à jour immédiatement
        await supabase
          .from('active_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', sessionIdRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      clearInterval(refreshInterval);
      removePresence();
      supabase.removeChannel(publicChannel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      initializingRef.current = false;
    };
  }, [user, isImpersonating, updatePresence, fetchActiveUsers, removePresence]);

  return {
    activeUsers,
    isOnline,
    updatePresence,
    loading
  };
};

export default usePresence;
