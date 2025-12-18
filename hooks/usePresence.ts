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
}

interface UsePresenceReturn {
  activeUsers: ActiveUser[];
  isOnline: boolean;
  updatePresence: (page?: string, tool?: 'docease' | 'signease' | null) => Promise<void>;
  loading: boolean;
}

// Clé pour stocker l'ID de session dans le localStorage (persistance entre rafraîchissements)
const SESSION_STORAGE_KEY = 'dashboard_session_id';

export const usePresence = (): UsePresenceReturn => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);

  // Nettoyer les anciennes sessions de cet utilisateur
  const cleanupOldSessions = useCallback(async (userId: string, keepSessionId?: string) => {
    try {
      // Supprimer toutes les sessions de cet utilisateur sauf celle en cours
      let query = supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);
      
      if (keepSessionId) {
        query = query.neq('id', keepSessionId);
      }
      
      await query;
    } catch (error) {
      console.error('Erreur nettoyage sessions:', error);
    }
  }, []);

  // Créer ou mettre à jour la session
  const updatePresence = useCallback(async (
    page: string = 'dashboard',
    tool: 'docease' | 'signease' | null = null
  ) => {
    if (!user) return;

    try {
      // Récupérer le nom et l'avatar de l'utilisateur depuis la table users
      const { data: userData } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', user.id)
        .single();

      if (sessionIdRef.current) {
        // Mettre à jour la session existante
        await supabase
          .from('active_sessions')
          .update({
            current_page: page,
            current_tool: tool,
            last_activity: new Date().toISOString(),
            user_name: userData?.name || null,
            avatar_url: userData?.avatar || null
          })
          .eq('id', sessionIdRef.current);
      } else {
        // D'abord, supprimer toutes les anciennes sessions de cet utilisateur
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
          // Sauvegarder dans localStorage pour persistance
          localStorage.setItem(SESSION_STORAGE_KEY, data.id);
          setIsOnline(true);
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour présence:', error);
    }
  }, [user, cleanupOldSessions]);

  // Supprimer la session
  const removePresence = useCallback(async () => {
    if (sessionIdRef.current) {
      await supabase
        .from('active_sessions')
        .delete()
        .eq('id', sessionIdRef.current);
      
      sessionIdRef.current = null;
      setIsOnline(false);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  // Récupérer les utilisateurs actifs (dédupliqués par user_id)
  const fetchActiveUsers = useCallback(async () => {
    try {
      // Nettoyer les sessions inactives (plus de 5 minutes sans activité)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from('active_sessions')
        .delete()
        .lt('last_activity', fiveMinutesAgo);

      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .gte('last_activity', fiveMinutesAgo)
        .order('last_activity', { ascending: false });

      if (!error && data) {
        // Dédupliquer par user_id - garder seulement la session la plus récente par utilisateur
        const userMap = new Map<string, ActiveUser>();
        data.forEach((session: ActiveUser) => {
          const existing = userMap.get(session.user_id);
          if (!existing || new Date(session.last_activity) > new Date(existing.last_activity)) {
            userMap.set(session.user_id, session);
          }
        });
        
        setActiveUsers(Array.from(userMap.values()));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs actifs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialisation
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Éviter les initialisations multiples
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initSession = async () => {
      // Vérifier s'il y a une session existante dans localStorage
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (storedSessionId) {
        // Vérifier si cette session existe encore en base
        const { data: existingSession } = await supabase
          .from('active_sessions')
          .select('id, user_id')
          .eq('id', storedSessionId)
          .eq('user_id', user.id)
          .single();
        
        if (existingSession) {
          // Réutiliser la session existante
          sessionIdRef.current = storedSessionId;
          setIsOnline(true);
          // Mettre à jour le timestamp
          await supabase
            .from('active_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', storedSessionId);
        } else {
          // La session n'existe plus, en créer une nouvelle
          localStorage.removeItem(SESSION_STORAGE_KEY);
          await updatePresence('dashboard');
        }
      } else {
        // Pas de session stockée, en créer une nouvelle
        await updatePresence('dashboard');
      }
      
      // Charger les utilisateurs actifs
      await fetchActiveUsers();
    };

    initSession();

    // Heartbeat toutes les 30 secondes
    heartbeatIntervalRef.current = setInterval(() => {
      if (sessionIdRef.current) {
        supabase
          .from('active_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', sessionIdRef.current)
          .then(() => {});
      }
    }, 30000);

    // Souscription realtime
    const channel = supabase
      .channel('active_sessions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        () => {
          fetchActiveUsers();
        }
      )
      .subscribe();

    // Nettoyage à la fermeture
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Utiliser sendBeacon pour la déconnexion synchrone
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?id=eq.${sessionIdRef.current}`,
          ''
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // L'utilisateur a quitté l'onglet
        if (sessionIdRef.current) {
          supabase
            .from('active_sessions')
            .update({ 
              last_activity: new Date().toISOString(),
              metadata: { status: 'away' }
            })
            .eq('id', sessionIdRef.current)
            .then(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        // L'utilisateur est revenu
        if (sessionIdRef.current) {
          supabase
            .from('active_sessions')
            .update({ 
              last_activity: new Date().toISOString(),
              metadata: { status: 'active' }
            })
            .eq('id', sessionIdRef.current)
            .then(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      removePresence();
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updatePresence, fetchActiveUsers, removePresence]);

  return {
    activeUsers,
    isOnline,
    updatePresence,
    loading
  };
};

export default usePresence;
