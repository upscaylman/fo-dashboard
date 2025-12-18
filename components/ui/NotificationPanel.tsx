import React, { useState } from 'react';
import { X, Check, CheckCheck, Trash2, FileText, PenTool, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationPanel: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllRead 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_created':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'signature_created':
        return <PenTool className="w-5 h-5 text-green-500" />;
      case 'user_action':
        return <Info className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 60) return 'à l\'instant';
      if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
      if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`;
      if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)} j`;
      
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return 'à l\'instant';
    }
  };

  return (
    <>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white dark:border-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              
              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tout marquer comme lu
                    </button>
                  )}
                  <button
                    onClick={deleteAllRead}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer lues
                  </button>
                </div>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Aucune notification
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          
                          {notification.message && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                              {notification.message}
                            </p>
                          )}

                          {notification.actor && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                              Par {notification.actor.name}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 dark:text-slate-600">
                              {formatDate(notification.created_at)}
                            </span>

                            <div className="flex gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                  title="Marquer comme lu"
                                >
                                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
