import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Users, Calendar, Filter, 
  Clock, Search, ChevronDown,
  FileCheck, Send, User,
  BarChart3, PieChart, RefreshCw, X, Eye
} from 'lucide-react';
import { Card, CardHeader } from '../../ui/Card';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import SelectBottomSheet from '../../ui/SelectBottomSheet';

// Rôles restreints qui ne voient que leurs propres données
const RESTRICTED_ROLES = ['secretary_federal'];

interface ActivityEvent {
  id: string;
  type: 'docease' | 'signease';
  title: string;
  document_type: string;
  user_email: string;
  user_name?: string;
  user_avatar?: string;
  date: string;
  metadata?: {
    format?: string;
    destinataire?: string;
    email_envoi?: string;
  };
}

interface UserStats {
  email: string;
  name?: string;
  avatar?: string;
  doceaseCount: number;
  signaturesCount: number;
  lastActivity: string;
  activities: ActivityEvent[];
}

type DateFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type SourceFilter = 'all' | 'docease' | 'signease';

const AnalyticsView: React.FC = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'users'>('timeline');

  // Récupérer le contexte d'authentification pour filtrer les données
  const { user, isImpersonating } = useAuth();
  
  // Déterminer si on doit filtrer les données (rôle restreint ou impersonation d'un rôle restreint)
  const effectiveRole = user?.role || 'secretary';
  const isRestrictedView = RESTRICTED_ROLES.includes(effectiveRole);
  const effectiveUserId = user?.id;
  const effectiveUserEmail = user?.email;

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculer la date de début selon le filtre
      const getStartDate = () => {
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            now.setHours(0, 0, 0, 0);
            return now.toISOString();
          case 'week':
            now.setDate(now.getDate() - 7);
            return now.toISOString();
          case 'month':
            now.setMonth(now.getMonth() - 1);
            return now.toISOString();
          case 'quarter':
            now.setMonth(now.getMonth() - 3);
            return now.toISOString();
          case 'year':
            now.setFullYear(now.getFullYear() - 1);
            return now.toISOString();
          default:
            return null;
        }
      };

      const startDate = getStartDate();

      // Récupérer les utilisateurs avec leurs avatars
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, name, avatar, avatar_url');

      // Créer une map par id ET par email pour la correspondance
      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));
      const usersMapByEmail = new Map((usersData || []).map((u: any) => [u.email, u]));

      // Récupérer les documents DocEase
      let doceaseQuery = supabase
        .from('docease_documents')
        .select('id, document_type, title, created_at, metadata, user_id')
        .order('created_at', { ascending: false });
      
      if (startDate) {
        doceaseQuery = doceaseQuery.gte('created_at', startDate);
      }
      
      // Filtrer par utilisateur si vue restreinte
      if (isRestrictedView && effectiveUserId) {
        doceaseQuery = doceaseQuery.eq('user_id', effectiveUserId);
      }
      
      const { data: doceaseData } = await doceaseQuery;

      // Récupérer les signatures
      let signaturesQuery = supabase
        .from('signatures')
        .select('id, signed_at, user_id, document_id')
        .order('signed_at', { ascending: false });
      
      if (startDate) {
        signaturesQuery = signaturesQuery.gte('signed_at', startDate);
      }
      
      // Filtrer par utilisateur si vue restreinte
      if (isRestrictedView && effectiveUserId) {
        signaturesQuery = signaturesQuery.eq('user_id', effectiveUserId);
      }
      
      const { data: signaturesData } = await signaturesQuery;

      // Récupérer les activités SignEase
      let signeaseQuery = supabase
        .from('signease_activity')
        .select('id, user_email, user_name, action_type, document_name, recipient_email, recipient_name, envelope_id, metadata, created_at')
        .order('created_at', { ascending: false });
      
      if (startDate) {
        signeaseQuery = signeaseQuery.gte('created_at', startDate);
      }
      
      // Filtrer par email utilisateur si vue restreinte
      if (isRestrictedView && effectiveUserEmail) {
        signeaseQuery = signeaseQuery.eq('user_email', effectiveUserEmail);
      }
      
      const { data: signeaseData } = await signeaseQuery;

      // Construire la liste des activités
      const allActivities: ActivityEvent[] = [];

      // Ajouter les DocEase
      (doceaseData || []).forEach((doc: any) => {
        const user = usersMap.get(doc.user_id);
        const userEmail = doc.metadata?.email_envoi || user?.email || 'inconnu';
        // Récupérer l'avatar depuis la map par email si pas trouvé par id
        const avatarUser = user || usersMapByEmail.get(userEmail);
        
        allActivities.push({
          id: `docease-${doc.id}`,
          type: 'docease',
          title: doc.title || 'Document sans titre',
          document_type: doc.document_type || 'Document',
          user_email: userEmail,
          user_name: user?.name,
          user_avatar: avatarUser?.avatar || avatarUser?.avatar_url,
          date: doc.created_at,
          metadata: doc.metadata
        });
      });

      // Ajouter les signatures (table legacy)
      (signaturesData || []).forEach((sig: any) => {
        const user = usersMap.get(sig.user_id);
        
        allActivities.push({
          id: `signature-${sig.id}`,
          type: 'signease',
          title: `Signature #${sig.id}`,
          document_type: 'Signature PDF',
          user_email: user?.email || 'inconnu',
          user_name: user?.name,
          user_avatar: user?.avatar || user?.avatar_url,
          date: sig.signed_at
        });
      });

      // Ajouter les activités SignEase (nouvelle table)
      (signeaseData || []).forEach((activity: any) => {
        const actionLabels: { [key: string]: string } = {
          'document_sent': 'Envoyé pour signature',
          'document_signed': 'Document signé',
          'document_rejected': 'Document rejeté',
          'document_created': 'Brouillon créé'
        };
        
        // Récupérer l'avatar depuis la map par email
        const avatarUser = usersMapByEmail.get(activity.user_email);
        
        allActivities.push({
          id: `signease-activity-${activity.id}`,
          type: 'signease',
          title: activity.document_name || 'Document SignEase',
          document_type: actionLabels[activity.action_type] || activity.action_type,
          user_email: activity.user_email,
          user_name: activity.user_name,
          user_avatar: avatarUser?.avatar || avatarUser?.avatar_url,
          date: activity.created_at,
          metadata: {
            ...activity.metadata,
            destinataire: activity.recipient_name || activity.recipient_email,
            action_type: activity.action_type,
            envelope_id: activity.envelope_id
          }
        });
      });

      // Trier par date décroissante
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Construire les stats par utilisateur
      const userStatsMap = new Map<string, UserStats>();

      allActivities.forEach(activity => {
        const email = activity.user_email;
        const existing = userStatsMap.get(email) || {
          email,
          name: activity.user_name,
          avatar: activity.user_avatar,
          doceaseCount: 0,
          signaturesCount: 0,
          lastActivity: activity.date,
          activities: []
        };
        
        // Mettre à jour l'avatar si pas encore défini
        if (!existing.avatar && activity.user_avatar) {
          existing.avatar = activity.user_avatar;
        }

        if (activity.type === 'docease') {
          existing.doceaseCount++;
        } else {
          existing.signaturesCount++;
        }

        existing.activities.push(activity);
        
        if (!existing.name && activity.user_name) {
          existing.name = activity.user_name;
        }

        if (new Date(activity.date) > new Date(existing.lastActivity)) {
          existing.lastActivity = activity.date;
        }

        userStatsMap.set(email, existing);
      });

      setActivities(allActivities);
      setUsers(Array.from(userStatsMap.values())
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()));

    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter, isRestrictedView, effectiveUserId, effectiveUserEmail]);

  // Souscription realtime
  useEffect(() => {
    const channel = supabase
      .channel('analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docease_documents' }, fetchAnalytics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signatures' }, fetchAnalytics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signease_activity' }, fetchAnalytics)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dateFilter, isRestrictedView, effectiveUserId, effectiveUserEmail]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Activités filtrées
  const filteredActivities = useMemo(() => {
    let result = activities;

    // Filtre par source
    if (sourceFilter === 'docease') {
      result = result.filter(a => a.type === 'docease');
    } else if (sourceFilter === 'signease') {
      result = result.filter(a => a.type === 'signease');
    }

    // Filtre par utilisateur sélectionné
    if (selectedUser) {
      result = result.filter(a => a.user_email === selectedUser);
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.title?.toLowerCase().includes(term) || 
        a.document_type?.toLowerCase().includes(term) ||
        a.user_email?.toLowerCase().includes(term) ||
        a.user_name?.toLowerCase().includes(term) ||
        a.metadata?.destinataire?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [activities, sourceFilter, selectedUser, searchTerm]);

  // Utilisateurs filtrés
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filtre par source
    if (sourceFilter === 'docease') {
      result = result.filter(u => u.doceaseCount > 0);
    } else if (sourceFilter === 'signease') {
      result = result.filter(u => u.signaturesCount > 0);
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.email.toLowerCase().includes(term) || 
        u.name?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, sourceFilter, searchTerm]);

  // Stats globales
  const stats = useMemo(() => {
    const totalDocease = filteredActivities.filter(a => a.type === 'docease').length;
    const totalSignatures = filteredActivities.filter(a => a.type === 'signease').length;
    const uniqueUsers = new Set(filteredActivities.map(a => a.user_email)).size;

    return { totalDocease, totalSignatures, uniqueUsers, total: filteredActivities.length };
  }, [filteredActivities]);

  // Données pour graphique par type de document
  const documentTypeStats = useMemo(() => {
    const typeCount: { [key: string]: number } = {};
    
    filteredActivities.forEach(activity => {
      const type = activity.document_type || 'Autre';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 types
  }, [filteredActivities]);

  // Données pour graphique d'évolution par jour
  const dailyStats = useMemo(() => {
    const dayCount: { [key: string]: { docease: number; signease: number; date: Date } } = {};
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.date);
      const dayKey = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      if (!dayCount[dayKey]) {
        dayCount[dayKey] = { docease: 0, signease: 0, date };
      }
      
      if (activity.type === 'docease') {
        dayCount[dayKey].docease++;
      } else {
        dayCount[dayKey].signease++;
      }
    });

    // Nombre de jours à afficher selon le filtre
    const maxDays = dateFilter === 'today' ? 1 :
                    dateFilter === 'week' ? 7 :
                    dateFilter === 'month' ? 30 :
                    dateFilter === 'quarter' ? 90 :
                    dateFilter === 'year' ? 365 :
                    999; // all

    return Object.entries(dayCount)
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .slice(-Math.min(maxDays, 30)) // Max 30 barres pour lisibilité
      .map(([day, data]) => ({ day, ...data }));
  }, [filteredActivities, dateFilter]);

  // Grouper les activités par jour
  const activitiesByDay = useMemo(() => {
    const groups: { [key: string]: ActivityEvent[] } = {};
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.date);
      const key = date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de filtres */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtres</span>
          </div>

          {/* Filtre date */}
          <SelectBottomSheet
            value={dateFilter}
            onChange={(value) => setDateFilter(value as DateFilter)}
            options={[
              { value: 'today', label: "Aujourd'hui" },
              { value: 'week', label: '7 derniers jours' },
              { value: 'month', label: '30 derniers jours' },
              { value: 'quarter', label: '3 derniers mois' },
              { value: 'year', label: '12 derniers mois' },
              { value: 'all', label: 'Tout' }
            ]}
            label="Période"
            renderTrigger={({ onClick, label }) => (
              <div className="relative">
                <button
                  type="button"
                  onClick={onClick}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {label}
                </button>
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          />

          {/* Filtre source */}
          <SelectBottomSheet
            value={sourceFilter}
            onChange={(value) => setSourceFilter(value as SourceFilter)}
            options={[
              { value: 'all', label: 'Toutes sources' },
              { value: 'docease', label: 'DocEase' },
              { value: 'signease', label: 'SignEase' }
            ]}
            label="Source"
            renderTrigger={({ onClick, label }) => (
              <div className="relative">
                <button
                  type="button"
                  onClick={onClick}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {label}
                </button>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          />

          {/* Filtre par salarié - masqué pour les rôles restreints */}
          {!isRestrictedView && (
            <SelectBottomSheet
              value={selectedUser || ''}
              onChange={(value) => setSelectedUser(value || null)}
              options={[
                { value: '', label: '👥 Tous les salariés' },
                ...users.map(user => ({
                  value: user.email,
                  label: `${user.name || user.email.split('@')[0]} (${user.doceaseCount + user.signaturesCount})`
                }))
              ]}
              label="Salarié"
              renderTrigger={({ onClick, label }) => (
                <div className="relative">
                  <button
                    type="button"
                    onClick={onClick}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-w-[180px] text-left"
                  >
                    {label}
                  </button>
                  <User className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
            />
          )}

          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Boutons de vue - masqués pour les rôles restreints (pas de vue "par salarié") */}
          {!isRestrictedView && (
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📋 Timeline
              </button>
              <button
                onClick={() => setViewMode('users')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'users' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                👥 Par salarié
              </button>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Badges de filtres actifs */}
        {(selectedUser || searchTerm) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {selectedUser && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                <User className="w-3 h-3" />
                {users.find(u => u.email === selectedUser)?.name || selectedUser}
                <button onClick={() => setSelectedUser(null)} className="hover:text-purple-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <Search className="w-3 h-3" />
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPIs - 4 cartes pour les rôles normaux, 3 pour secretary_federal */}
      <div className={`grid gap-4 ${isRestrictedView ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-6 h-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">DocEase</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalDocease}</div>
          <div className="text-sm opacity-80">Documents générés</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FileCheck className="w-6 h-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">SignEase</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalSignatures}</div>
          <div className="text-sm opacity-80">Signatures</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Send className="w-6 h-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Total</span>
          </div>
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-sm opacity-80">Actions totales</div>
        </div>

        {/* Carte Salariés actifs - masquée pour les rôles restreints */}
        {!isRestrictedView && (
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Actifs</span>
            </div>
            <div className="text-3xl font-bold">{stats.uniqueUsers}</div>
            <div className="text-sm opacity-80">Salariés actifs</div>
          </div>
        )}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Évolution temporelle */}
        <Card>
          <CardHeader 
            title="Évolution de l'activité" 
            subtitle={
              dateFilter === 'today' ? "Aujourd'hui" :
              dateFilter === 'week' ? '7 derniers jours' :
              dateFilter === 'month' ? '30 derniers jours' :
              dateFilter === 'quarter' ? '3 derniers mois' :
              dateFilter === 'year' ? '12 derniers mois' :
              'Toutes les données'
            }
            action={
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </div>
            }
          />
          <div className="p-4">
            {dailyStats.length === 0 ? (
              <div className="text-center text-slate-400 py-8">Aucune donnée pour cette période</div>
            ) : (
              <div className="space-y-3">
                {/* Légende */}
                <div className="flex justify-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">DocEase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">SignEase</span>
                  </div>
                </div>
                
                {/* Barres empilées */}
                <div className="flex items-end gap-1" style={{ height: '160px' }}>
                  {dailyStats.map((day, idx) => {
                    const maxTotal = Math.max(...dailyStats.map(d => d.docease + d.signease), 1);
                    const total = day.docease + day.signease;
                    const totalHeight = total > 0 ? Math.max((total / maxTotal) * 140, 8) : 0;
                    const doceaseHeight = total > 0 ? (day.docease / total) * totalHeight : 0;
                    const signeaseHeight = total > 0 ? (day.signease / total) * totalHeight : 0;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        {/* Tooltip au survol */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                          {total > 0 ? `${day.docease} Doc / ${day.signease} Sign` : '0'}
                        </div>
                        
                        {/* Conteneur des barres aligné en bas */}
                        <div className="flex-1 flex flex-col justify-end w-full">
                          {/* Barre SignEase (rouge) - en haut */}
                          {day.signease > 0 && (
                            <div 
                              className="w-full bg-red-500 rounded-t-sm hover:bg-red-400 transition-colors"
                              style={{ height: `${signeaseHeight}px` }}
                            ></div>
                          )}
                          
                          {/* Barre DocEase (violet) - en bas */}
                          {day.docease > 0 && (
                            <div 
                              className={`w-full bg-purple-500 hover:bg-purple-400 transition-colors ${day.signease === 0 ? 'rounded-t-sm' : ''}`}
                              style={{ height: `${doceaseHeight}px` }}
                            ></div>
                          )}
                          
                          {/* Barre vide si pas de données */}
                          {total === 0 && (
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-sm" style={{ height: '4px' }}></div>
                          )}
                        </div>
                        
                        {/* Label du jour */}
                        <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center">{day.day}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Résumé période */}
                <div className="flex justify-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <span className="text-xs text-slate-500">
                    Total période: <span className="font-bold text-purple-600">{dailyStats.reduce((sum, d) => sum + d.docease, 0)}</span> DocEase, 
                    <span className="font-bold text-red-500 ml-1">{dailyStats.reduce((sum, d) => sum + d.signease, 0)}</span> SignEase
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Graphique Répartition par type - Camembert */}
        <Card>
          <CardHeader 
            title="Types de documents" 
            subtitle="Répartition"
            action={
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <PieChart className="w-5 h-5" />
              </div>
            }
          />
          <div className="p-4">
            {documentTypeStats.length === 0 ? (
              <div className="text-center text-slate-400 py-8">Aucune donnée pour cette période</div>
            ) : (
              <div className="flex items-center gap-6">
                {/* Camembert SVG */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      const total = documentTypeStats.reduce((sum, t) => sum + t.count, 0);
                      let cumulativePercent = 0;
                      const colors = [
                        '#8b5cf6', // purple
                        '#ef4444', // red
                        '#6366f1', // indigo
                        '#10b981', // emerald
                        '#f59e0b', // amber
                        '#06b6d4', // cyan
                      ];
                      
                      return documentTypeStats.map((type, idx) => {
                        const percent = (type.count / total) * 100;
                        const startPercent = cumulativePercent;
                        cumulativePercent += percent;
                        
                        // Calcul du chemin d'arc
                        const startAngle = (startPercent / 100) * 360;
                        const endAngle = (cumulativePercent / 100) * 360;
                        const largeArcFlag = percent > 50 ? 1 : 0;
                        
                        const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                        const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                        
                        // Si c'est le seul élément ou 100%, dessiner un cercle complet
                        if (percent >= 99.9) {
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="40"
                              fill={colors[idx % colors.length]}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          );
                        }
                        
                        const pathData = `
                          M 50 50
                          L ${startX} ${startY}
                          A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}
                          Z
                        `;
                        
                        return (
                          <path
                            key={idx}
                            d={pathData}
                            fill={colors[idx % colors.length]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Centre avec total */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white drop-shadow-lg">
                        {documentTypeStats.reduce((sum, t) => sum + t.count, 0)}
                      </div>
                      <div className="text-xs text-white/90 drop-shadow">total</div>
                    </div>
                  </div>
                </div>
                
                {/* Légende */}
                <div className="flex-1 space-y-2">
                  {documentTypeStats.map((type, idx) => {
                    const total = documentTypeStats.reduce((sum, t) => sum + t.count, 0);
                    const percent = ((type.count / total) * 100).toFixed(1);
                    const colors = [
                      'bg-purple-500',
                      'bg-red-500',
                      'bg-indigo-500',
                      'bg-emerald-500',
                      'bg-amber-500',
                      'bg-cyan-500',
                    ];
                    
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`w-3 h-3 rounded-sm ${colors[idx % colors.length]} shrink-0`}></div>
                        <span className="truncate flex-1 text-slate-600 dark:text-slate-400">{type.name}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{type.count}</span>
                        <span className="text-slate-400 text-xs">({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Contenu principal */}
      {viewMode === 'timeline' ? (
        /* Vue Timeline */
        <Card className="overflow-hidden">
          <CardHeader 
            title="Historique d'activité" 
            subtitle={`${filteredActivities.length} action${filteredActivities.length > 1 ? 's' : ''}`}
            action={
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
            }
          />
          
          <div className="max-h-[600px] overflow-y-auto">
            {Object.keys(activitiesByDay).length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune activité trouvée</p>
              </div>
            ) : (
              Object.entries(activitiesByDay).map(([day, dayActivities]) => (
                <div key={day} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 z-10">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      📅 {day}
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {dayActivities.map(activity => (
                      <div 
                        key={activity.id}
                        className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(activity.user_email)}
                      >
                        {/* Icône type */}
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'docease' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {activity.type === 'docease' ? <FileText className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                {activity.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                  activity.type === 'docease' 
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {activity.type === 'docease' ? 'DocEase' : 'SignEase'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {activity.document_type}
                                </span>
                                {activity.metadata?.destinataire && (
                                  <span className="text-xs text-slate-400">
                                    → {activity.metadata.destinataire}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {formatTime(activity.date)}
                            </span>
                          </div>

                          {/* Utilisateur */}
                          <div className="flex items-center gap-2 mt-2">
                            {activity.user_avatar ? (
                              <img 
                                src={activity.user_avatar} 
                                alt={activity.user_name || activity.user_email}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {(activity.user_name || activity.user_email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {activity.user_name || activity.user_email.split('@')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        /* Vue par salarié */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des salariés */}
          <Card>
            <CardHeader 
              title="Salariés" 
              subtitle={`${filteredUsers.length} actif${filteredUsers.length > 1 ? 's' : ''}`}
              action={
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
              }
            />
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.email}
                  onClick={() => setSelectedUser(user.email === selectedUser ? null : user.email)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedUser === user.email 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name || user.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {user.name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <FileText className="w-4 h-4" />
                        <span className="font-bold">{user.doceaseCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <FileCheck className="w-4 h-4" />
                        <span className="font-bold">{user.signaturesCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Dernière activité : {formatRelativeTime(user.lastActivity)}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center text-slate-500 py-8">Aucun salarié trouvé</div>
              )}
            </div>
          </Card>

          {/* Détails du salarié sélectionné */}
          <Card>
            <CardHeader 
              title={selectedUser ? (users.find(u => u.email === selectedUser)?.name || selectedUser) : 'Sélectionnez un salarié'}
              subtitle={selectedUser ? `${users.find(u => u.email === selectedUser)?.activities.length || 0} actions` : 'Cliquez sur un salarié pour voir son activité'}
              action={
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
              }
            />
            <div className="max-h-[500px] overflow-y-auto">
              {selectedUser ? (
                <div className="space-y-2">
                  {users.find(u => u.email === selectedUser)?.activities.map(activity => (
                    <div 
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        activity.type === 'docease' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      }`}>
                        {activity.type === 'docease' ? <FileText className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.document_type}
                          {activity.metadata?.destinataire && ` → ${activity.metadata.destinataire}`}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400 shrink-0">
                        {formatRelativeTime(activity.date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Sélectionnez un salarié dans la liste</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
