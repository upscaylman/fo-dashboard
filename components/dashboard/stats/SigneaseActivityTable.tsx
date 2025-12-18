import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Calendar, Search, ChevronDown, ArrowUp, ArrowDown, Send, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SigneaseActivity {
  id: number;
  user_email: string;
  user_name: string | null;
  action_type: 'document_created' | 'document_sent' | 'document_signed' | 'document_rejected';
  document_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  envelope_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const SigneaseActivityTable: React.FC = () => {
  const [activities, setActivities] = useState<SigneaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetchActivities();

    // Realtime subscription pour mise à jour automatique
    const channel = supabase
      .channel('signease_activity_table')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signease_activity'
        },
        () => {
          console.log('🔄 Activité SignEase changée, rechargement...');
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('signease_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Erreur chargement activités SignEase:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des activités
  const filteredActivities = useMemo(() => {
    const filtered = activities.filter(activity => {
      const matchSearch = searchTerm === '' || 
        activity.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || activity.action_type === filterType;

      return matchSearch && matchType;
    });

    // Tri par date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [activities, searchTerm, filterType, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'document_created': return <FileText className="w-4 h-4" />;
      case 'document_sent': return <Send className="w-4 h-4" />;
      case 'document_signed': return <CheckCircle className="w-4 h-4" />;
      case 'document_rejected': return <XCircle className="w-4 h-4" />;
      default: return <Edit3 className="w-4 h-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'document_created': return 'Créé';
      case 'document_sent': return 'Envoyé';
      case 'document_signed': return 'Signé';
      case 'document_rejected': return 'Rejeté';
      default: return type;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'document_created': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/50';
      case 'document_sent': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700/50';
      case 'document_signed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50';
      case 'document_rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bandeau d'information */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Edit3 className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-1">
              ✍️ Suivi des signatures électroniques
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Historique des documents envoyés, signés et rejetés via SignEase.
              Les activités sont synchronisées en temps réel depuis l'application de signature.
            </p>
          </div>
          <a 
            href="http://localhost:5000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all shrink-0"
          >
            Ouvrir SignEase
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par document, utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none cursor-pointer pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
            >
              <option value="all">Toutes les actions</option>
              <option value="document_sent">Envoyés</option>
              <option value="document_signed">Signés</option>
              <option value="document_rejected">Rejetés</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{activities.length}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Total activités</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {activities.filter(a => a.action_type === 'document_sent').length}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-500">Envoyés</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {activities.filter(a => a.action_type === 'document_signed').length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-500">Signés</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {activities.filter(a => a.action_type === 'document_rejected').length}
          </div>
          <div className="text-sm text-red-600 dark:text-red-500">Rejetés</div>
        </div>
      </div>

      {/* Tableau des activités */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Destinataire
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors select-none"
                  onClick={toggleSortOrder}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {sortOrder === 'desc' ? (
                      <ArrowDown className="w-4 h-4 text-orange-500" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Edit3 className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium mb-1">Aucune activité SignEase</p>
                    <p className="text-sm">Les signatures apparaîtront ici automatiquement.</p>
                    <a 
                      href="http://localhost:5000" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      Ouvrir SignEase
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(activity.action_type)}`}>
                        {getActionIcon(activity.action_type)}
                        {getActionLabel(activity.action_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {activity.document_name || 'Sans titre'}
                          </div>
                          {activity.envelope_id && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {activity.envelope_id.substring(0, 20)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(activity.user_name || activity.user_email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {activity.user_name || activity.user_email?.split('@')[0]}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {activity.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {activity.recipient_email ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs font-medium">
                            {(activity.recipient_name || activity.recipient_email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {activity.recipient_name || activity.recipient_email?.split('@')[0]}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {activity.recipient_email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {formatDate(activity.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer avec total */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Affichage de <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredActivities.length}</span> sur <span className="font-semibold text-slate-700 dark:text-slate-300">{activities.length}</span> activités
      </div>
    </div>
  );
};

export default SigneaseActivityTable;
