import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:users!notifications_actor_id_fkey(name, email, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erreur chargement notifications:', error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

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
        (payload) => {
          console.log('Notification change:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur marquage notification:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false);

    if (error) {
      console.error('Erreur marquage notifications:', error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur suppression notification:', error);
      return;
    }

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? prev - 1 : prev;
    });
  };

  const deleteAllRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user?.id)
      .eq('read', true);

    if (error) {
      console.error('Erreur suppression notifications lues:', error);
      return;
    }

    setNotifications(prev => prev.filter(n => !n.read));
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refresh: fetchNotifications
  };
};
