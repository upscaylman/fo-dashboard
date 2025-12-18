import React, { useState } from 'react';
import { Users, Circle, FileText, FileSignature, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { usePresence, ActiveUser } from '../../hooks/usePresence';
import { Card, CardHeader } from '../ui/Card';

// Récupérer l'URL d'avatar (depuis la session ou fallback DiceBear)
const getAvatarUrl = (user: ActiveUser) => {
  if (user.avatar_url) {
    return user.avatar_url;
  }
  // Fallback: générer avec le prénom
  const name = user.user_name || user.user_email.split('@')[0];
  const firstName = name.split(' ')[0];
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName)}`;
};

const ActiveUsersWidget: React.FC = () => {
  const { activeUsers, loading } = usePresence();
  const [isExpanded, setIsExpanded] = useState(true);

  const formatActivityTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 30) return 'À l\'instant';
    if (diffSecs < 60) return `Il y a ${diffSecs}s`;
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getToolIcon = (tool: string | null | undefined) => {
    switch (tool) {
      case 'docease':
        return <FileText className="w-3 h-3 text-purple-500" />;
      case 'signease':
        return <FileSignature className="w-3 h-3 text-red-500" />;
      default:
        return <Monitor className="w-3 h-3 text-slate-400" />;
    }
  };

  const getToolLabel = (tool: string | null | undefined) => {
    switch (tool) {
      case 'docease':
        return 'DocEase';
      case 'signease':
        return 'SignEase';
      default:
        return 'Dashboard';
    }
  };

  const getStatusColor = (user: ActiveUser) => {
    const lastActivity = new Date(user.last_activity);
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = diffMs / 60000;

    if (diffMins < 1) return 'bg-green-500'; // Actif
    if (diffMins < 3) return 'bg-yellow-500'; // Récemment actif
    return 'bg-slate-400'; // Inactif
  };

  if (loading) {
    return (
      <Card>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Utilisateurs en ligne
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeUsers.length} actif{activeUsers.length > 1 ? 's' : ''} en ce moment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Avatars empilés */}
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((user) => (
              <img 
                key={user.id}
                src={getAvatarUrl(user)}
                alt={user.user_name || user.user_email}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-white dark:bg-slate-800"
                title={user.user_name || user.user_email}
              />
            ))}
            {activeUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold border-2 border-white dark:border-slate-900">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {activeUsers.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              Aucun utilisateur actif
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-64 overflow-y-auto">
              {activeUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  {/* Avatar avec indicateur de statut */}
                  <div className="relative">
                    <img 
                      src={getAvatarUrl(user)}
                      alt={user.user_name || user.user_email}
                      className="w-10 h-10 rounded-full bg-white dark:bg-slate-800"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${getStatusColor(user)} border-2 border-white dark:border-slate-900`}></div>
                  </div>

                  {/* Infos utilisateur */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                        {user.user_name || user.user_email.split('@')[0]}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        user.current_tool === 'docease' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : user.current_tool === 'signease'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {getToolIcon(user.current_tool)}
                        {getToolLabel(user.current_tool)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {user.user_email}
                    </p>
                  </div>

                  {/* Dernière activité */}
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">
                      {formatActivityTime(user.last_activity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ActiveUsersWidget;
