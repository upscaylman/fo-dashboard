import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  isInBackoff, 
  recordSuccess, 
  recordFailure, 
  isTransientError,
  queryViaEdgeFunction,
  insertViaEdgeFunction,
  deleteViaEdgeFunction,
  shouldUseEdgeFallback,
  enableEdgeFallback
} from '../lib/supabaseRetry';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  read: boolean;
  created_at: string;
  actor?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Debounce pour éviter les appels multiples
const DEBOUNCE_MS = 1000;

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchNotifications = useCallback(async (force: boolean = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Skip si le service est en backoff
    if (isInBackoff()) {
      console.log('Notifications: skipped (service in backoff)');
      setLoading(false);
      return;
    }

    // Debounce - éviter les appels trop fréquents
    const now = Date.now();
    if (!force && now - lastFetchRef.current < DEBOUNCE_MS) {
      return;
    }
    lastFetchRef.current = now;

    try {
      // Utiliser Edge Function directement (PostgREST 503)
      const { data, error: edgeError } = await queryViaEdgeFunction<Notification[]>('notifications', {
        select: 'id,user_id,actor_id,type,title,message,data,read,created_at',
        eq: { user_id: user.id },
        orderBy: 'created_at',
        orderDesc: true,
        limit: 50
      });

      if (edgeError) {
        console.error('Notifications: Edge Function failed', edgeError);
        setLoading(false);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (e) {
      recordFailure(e);
      console.error('Erreur notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Ref pour éviter les re-créations de channels
  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

  // Debounced fetch pour les événements realtime - stable
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchNotificationsRef.current(false);
    }, DEBOUNCE_MS);
  }, []); // Pas de dépendances = fonction stable

  useEffect(() => {
    fetchNotifications(true);

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          // Utiliser debounce
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id, debouncedFetch]); // Dépendances minimales

  const markAsRead = async (notificationId: string) => {
    try {
      // Utiliser Edge Function pour la mise à jour
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          table: 'notifications',
          operation: 'update',
          data: { read: true },
          eq: { id: notificationId },
        }),
      });

      if (!response.ok) {
        console.error('Erreur markAsRead:', response.status);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Erreur markAsRead:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          table: 'notifications',
          operation: 'update',
          data: { read: true },
          eq: { user_id: user?.id, read: false },
        }),
      });

      if (!response.ok) {
        console.error('Erreur markAllAsRead:', response.status);
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Erreur markAllAsRead:', e);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteViaEdgeFunction('notifications', { id: notificationId });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? prev - 1 : prev;
      });
    } catch (e) {
      console.error('Erreur deleteNotification:', e);
    }
  };

  const deleteAllRead = async () => {
    try {
      // Supprimer via Edge Function les notifs lues de cet utilisateur
      await deleteViaEdgeFunction('notifications', { user_id: user?.id, read: true });

      setNotifications(prev => prev.filter(n => !n.read));
    } catch (e) {
      console.error('Erreur deleteAllRead:', e);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refresh: () => fetchNotifications(true)
  };
};