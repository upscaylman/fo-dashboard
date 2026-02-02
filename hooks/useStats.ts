import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { queryViaEdgeFunction } from '../lib/supabaseRetry';
import { archiveLinks } from '../constants';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity, NewsItem, ArchiveLink } from '../types';
import { FileText, Edit3, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  global: GlobalStat[];
  users: UserStat[];
  documentTypes: DocumentTypeStat[];
  activity: WeeklyActivity[];
}

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

// Rôles restreints qui ne voient que leurs propres données
const RESTRICTED_ROLES = ['secretary_federal'];

// Helper pour calculer la date de début selon le timeRange
const getStartDateFromRange = (range: TimeRange): Date => {
  const now = new Date();
  switch (range) {
    case 'week':
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return weekAgo;
    case 'month':
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      monthAgo.setHours(0, 0, 0, 0);
      return monthAgo;
    case 'quarter':
      const quarterAgo = new Date();
      quarterAgo.setDate(now.getDate() - 90);
      quarterAgo.setHours(0, 0, 0, 0);
      return quarterAgo;
    case 'year':
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      yearAgo.setHours(0, 0, 0, 0);
      return yearAgo;
    default:
      const defaultAgo = new Date();
      defaultAgo.setDate(now.getDate() - 30);
      defaultAgo.setHours(0, 0, 0, 0);
      return defaultAgo;
  }
};

// Helper pour obtenir le label de période
const getPeriodLabel = (range: TimeRange): string => {
  switch (range) {
    case 'week': return '7 derniers jours';
    case 'month': return '30 derniers jours';
    case 'quarter': return '3 derniers mois';
    case 'year': return 'Cette année';
    default: return '30 jours';
  }
};

// Hook pour les stats du dashboard avec chargement progressif
export const useStats = (timeRange: TimeRange = 'month') => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer le contexte d'authentification pour l'impersonation
  const { user, isImpersonating, realUser } = useAuth();
  
  // Déterminer si on doit filtrer les données
  // Vue restreinte si: impersonation d'un rôle restreint OU utilisateur nativement dans un rôle restreint
  const effectiveRole = user?.role || 'secretary';
  const isRestrictedView = RESTRICTED_ROLES.includes(effectiveRole);
  const effectiveUserId = user?.id;
  
  // Ref pour éviter les appels multiples en realtime (debounce)
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async (isRealtimeUpdate = false) => {
    try {
      // Ne pas montrer le loading pour les mises à jour realtime (UX fluide)
      if (!isRealtimeUpdate) {
        setLoading(true);
      }
      setError(null);

      // TOUJOURS utiliser Edge Function car PostgREST est 503
      console.log('[useStats] Using Edge Function exclusively (PostgREST 503)');

      // Helper pour filter signease par email si en vue restreinte
      const applyEmailFilter = (query: any) => {
        if (isRestrictedView && user?.email) {
          return query.eq('user_email', user.email);
        }
        return query;
      };

      // 1. Récupérer les stats globales via Edge Function directement
      const [documentsCount, signaturesCount, usersCount, doceaseCount, signeaseCount] = await Promise.all([
        queryViaEdgeFunction('documents', { 
          countOnly: true, 
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }),
        queryViaEdgeFunction('signatures', { 
          countOnly: true, 
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }),
        isRestrictedView 
          ? Promise.resolve({ data: null, count: 1, error: null })
          : queryViaEdgeFunction('users', { countOnly: true }),
        queryViaEdgeFunction('docease_documents', { 
          countOnly: true, 
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }),
        queryViaEdgeFunction('signease_activity', { 
          countOnly: true, 
          ...(isRestrictedView && user?.email ? { eq: { user_email: user.email } } : {})
        }),
      ]);

      // Compter les documents SignEase par type d'action
      const [signeaseSent, signeaseSigned, signeaseRejected] = await Promise.all([
        queryViaEdgeFunction('signease_activity', { 
          countOnly: true, 
          eq: { action_type: 'document_sent', ...(isRestrictedView && user?.email ? { user_email: user.email } : {}) }
        }),
        queryViaEdgeFunction('signease_activity', { 
          countOnly: true, 
          eq: { action_type: 'document_signed', ...(isRestrictedView && user?.email ? { user_email: user.email } : {}) }
        }),
        queryViaEdgeFunction('signease_activity', { 
          countOnly: true, 
          eq: { action_type: 'document_rejected', ...(isRestrictedView && user?.email ? { user_email: user.email } : {}) }
        }),
      ]);

      // Calculer les utilisateurs actifs selon la période sélectionnée
      const periodStartDate = getStartDateFromRange(timeRange);
      const periodLabel = getPeriodLabel(timeRange);

      // Utilisateurs qui ont créé des documents DocEase - via Edge Function
      const { data: activeDoceaseUsers } = await queryViaEdgeFunction<{ user_id: string }[]>(
        'docease_documents',
        {
          select: 'user_id',
          gte: { created_at: periodStartDate.toISOString() },
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }
      );

      // Utilisateurs qui ont signé des documents - via Edge Function
      const { data: activeSignatureUsers } = await queryViaEdgeFunction<{ user_id: string }[]>(
        'signatures',
        {
          select: 'user_id',
          gte: { signed_at: periodStartDate.toISOString() },
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }
      );

      // Utilisateurs qui ont envoyé des documents via SignEase - via Edge Function
      const { data: activeSigneaseUsers } = await queryViaEdgeFunction<{ user_email: string }[]>(
        'signease_activity',
        {
          select: 'user_email',
          gte: { created_at: periodStartDate.toISOString() },
          ...(isRestrictedView && user?.email ? { eq: { user_email: user.email } } : {})
        }
      );

      // Sessions actives récentes - via Edge Function
      const { data: activeDashboardUsers } = await queryViaEdgeFunction<{ user_email: string }[]>(
        'active_sessions',
        {
          select: 'user_email',
          gte: { started_at: periodStartDate.toISOString() },
          ...(isRestrictedView && user?.email ? { eq: { user_email: user.email } } : {})
        }
      );

      // Collecter tous les emails uniques (méthode principale)
      const allActiveEmails = new Set<string>();
      
      // Emails des activités SignEase
      activeSigneaseUsers?.forEach(s => {
        if (s.user_email) allActiveEmails.add(s.user_email.toLowerCase());
      });
      
      // Emails des sessions actives
      activeDashboardUsers?.forEach(s => {
        if (s.user_email) allActiveEmails.add(s.user_email.toLowerCase());
      });

      // Collecter les user_id pour DocEase et Signatures
      const activeUserIds = new Set<string>();
      activeDoceaseUsers?.forEach(d => {
        if (d.user_id) activeUserIds.add(d.user_id);
      });
      activeSignatureUsers?.forEach(s => {
        if (s.user_id) activeUserIds.add(s.user_id);
      });

      // Récupérer les emails des user_id trouvés via Edge Function
      if (activeUserIds.size > 0) {
        // Edge Function ne supporte pas 'IN', on fait une requête pour tous les users
        const { data: allUsers } = await queryViaEdgeFunction<{ id: string; email: string }[]>(
          'users',
          { select: 'id, email' }
        );
        const userIdArray = Array.from(activeUserIds);
        allUsers?.filter(u => userIdArray.includes(u.id)).forEach(u => {
          if (u.email) allActiveEmails.add(u.email.toLowerCase());
        });
      }

      // Le nombre d'utilisateurs actifs = nombre d'emails uniques (1 si vue restreinte)
      const activeUsersCount = isRestrictedView ? 1 : Math.max(allActiveEmails.size, activeUserIds.size);

      // Compter les documents/signatures via Edge Function avec countOnly
      const [periodDocuments, periodSignatures, periodDocease, periodSigneaseSent, periodSigneaseSigned] = await Promise.all([
        queryViaEdgeFunction('documents', {
          countOnly: true,
          gte: { created_at: periodStartDate.toISOString() },
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }),
        queryViaEdgeFunction('signatures', {
          countOnly: true,
          gte: { signed_at: periodStartDate.toISOString() },
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }),
        queryViaEdgeFunction('docease_documents', {
          countOnly: true,
          gte: { created_at: periodStartDate.toISOString() },
          ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
        }),
        queryViaEdgeFunction('signease_activity', {
          countOnly: true,
          eq: { action_type: 'document_sent' },
          gte: { created_at: periodStartDate.toISOString() },
          ...(isRestrictedView && user?.email ? { filters: { user_email: user.email } } : {})
        }),
        queryViaEdgeFunction('signease_activity', {
          countOnly: true,
          eq: { action_type: 'document_signed' },
          gte: { created_at: periodStartDate.toISOString() },
          ...(isRestrictedView && user?.email ? { filters: { user_email: user.email } } : {})
        }),
      ]);

        const globalStats: GlobalStat[] = [
          {
            label: 'Documents DocEase',
            value: String(periodDocease.count || 0),
            icon: FileText,
            color: 'text-purple-700',
            bgColor: 'bg-purple-100',
            trend: `${periodDocease.count || 0} sur la période`,
            description: `Generés via DocEase (${periodLabel})`
          },
          {
            label: 'Documents SignEase',
            value: String(periodSigneaseSent.count || 0),
            icon: Edit3,
            color: 'text-orange-700',
            bgColor: 'bg-orange-100',
            trend: `${periodSigneaseSent.count || 0} sur la période`,
            description: `Documents envoyés (${periodLabel})`
          },
          {
            label: 'Signatures realisées',
            value: String(periodSigneaseSigned.count || 0),
            icon: Edit3,
            color: 'text-green-700',
            bgColor: 'bg-green-100',
            trend: `${periodSigneaseSigned.count || 0} sur la période`,
            description: `PDFs signés via SignEase (${periodLabel})`
          },
          {
            label: 'Envois par email',
            value: String((periodDocease.count || 0) + (periodSigneaseSent.count || 0)),
            icon: Mail,
            color: 'text-indigo-700',
            bgColor: 'bg-indigo-100',
            trend: `${(periodDocease.count || 0) + (periodSigneaseSent.count || 0)} sur la période`,
            description: `Documents envoyés (${periodLabel})`
          },
          // Carte "Salariés actifs" - masquée pour les rôles restreints
          ...(!isRestrictedView ? [{
            label: 'Salariés actifs',
            value: String(activeUsersCount),
            icon: User,
            color: 'text-blue-700',
            bgColor: 'bg-blue-100',
            trend: `${activeUsersCount} actifs`,
            description: `Utilisateurs avec activité (${periodLabel})`
          }] : [])
        ];

        // 2. Récupérer les stats par utilisateur via Edge Function
        const { data: usersData } = await queryViaEdgeFunction<any[]>(
          'users',
          {
            select: 'id, name, email, role, role_level, avatar_url, avatar',
            ...(isRestrictedView && effectiveUserId ? { eq: { id: effectiveUserId } } : {}),
            limit: isRestrictedView ? 1 : 10
          }
        );

        // Pour chaque utilisateur, compter ses documents/signatures via Edge Function
        const userStats: UserStat[] = await Promise.all((usersData || []).map(async (u: any) => {
          const [docsCount, sigsCount, doceaseDocsCount] = await Promise.all([
            queryViaEdgeFunction('documents', { countOnly: true, eq: { user_id: u.id } }),
            queryViaEdgeFunction('signatures', { countOnly: true, eq: { user_id: u.id } }),
            queryViaEdgeFunction('docease_documents', { countOnly: true, eq: { user_id: u.id } }),
          ]);
          
          return {
            id: u.id,
            name: u.name,
            email: u.email || '',
            letters: (docsCount.count || 0) + (doceaseDocsCount.count || 0),
            signatures: sigsCount.count || 0,
            role: u.role_level || u.role || 'secretary',
            avatar_url: u.avatar_url || u.avatar || null,
          };
        }));

        // 3. Récupérer les stats par type de document via Edge Function
        const { data: doceaseTypesData } = await queryViaEdgeFunction<{ document_type: string }[]>(
          'docease_documents',
          {
            select: 'document_type',
            ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
          }
        );

        // Compter les documents par type
        const typeCounts: { [key: string]: number } = {};
        (doceaseTypesData || []).forEach((doc: any) => {
          const type = doc.document_type || 'Autre';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        // Couleurs prédéfinies pour les types de documents
        const typeColors: { [key: string]: string } = {
          'designation': 'bg-blue-500 dark:bg-blue-600',
          'negociation': 'bg-green-500 dark:bg-green-600',
          'circulaire': 'bg-purple-500 dark:bg-purple-600',
          'custom': 'bg-orange-500 dark:bg-orange-600',
          'Autre': 'bg-slate-500 dark:bg-slate-600'
        };

        const totalDocs = Math.max(doceaseCount.count || 1, 1);
        const documentTypeStats: DocumentTypeStat[] = Object.entries(typeCounts).map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count,
          percentage: Math.round((count / totalDocs) * 100),
          color: typeColors[type] || 'bg-slate-500 dark:bg-slate-600',
        }));

        // 4. Récupérer l'activité hebdomadaire via Edge Function
        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          return date;
        });

        const weeklyActivity: WeeklyActivity[] = await Promise.all(
          last7Days.map(async (date, index) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            // Utiliser Edge Function avec gte et lt
            const [doceaseResult, signaturesResult] = await Promise.all([
              queryViaEdgeFunction('docease_documents', {
                countOnly: true,
                gte: { created_at: date.toISOString() },
                lt: { created_at: nextDay.toISOString() },
                ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
              }),
              queryViaEdgeFunction('signatures', {
                countOnly: true,
                gte: { signed_at: date.toISOString() },
                lt: { signed_at: nextDay.toISOString() },
                ...(isRestrictedView && effectiveUserId ? { eq: { user_id: effectiveUserId } } : {})
              }),
            ]);

            return {
              day: dayNames[index % 7],
              letters: doceaseResult.count || 0,
              signatures: signaturesResult.count || 0,
            };
          })
        );

        setStats({
          global: globalStats,
          users: userStats,
          documentTypes: documentTypeStats,
          activity: weeklyActivity,
        });
      } catch (e: any) {
        console.error('Erreur lors du chargement des statistiques:', e);
        if (isMountedRef.current) {
          setError(e.message || 'Erreur de chargement');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, [timeRange, isRestrictedView, effectiveUserId, user?.email]);

  // Ref pour stocker fetchStats sans causer de re-render des channels
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  // Fonction de refresh avec debounce - stable (pas de dépendance sur fetchStats)
  const debouncedFetchStats = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchStatsRef.current(true); // true = realtime update (pas de loading spinner)
    }, 2000); // 2s debounce
  }, []); // Pas de dépendances = fonction stable

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();
  }, [fetchStats]); // Se déclenche quand fetchStats change (qui dépend de timeRange)

  // Channels Realtime - effet séparé avec dépendances minimales
  useEffect(() => {
    // Abonnement Realtime pour détecter les changements sur documents DocEase
    const doceaseChannel = supabase
      .channel('docease_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'docease_documents'
        },
        (payload) => {
          debouncedFetchStats(); // Utiliser la version debounced
        }
      )
      .subscribe();

    // Abonnement pour les signatures
    const signaturesChannel = supabase
      .channel('signatures_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'signatures'
        },
        (payload) => {
          debouncedFetchStats();
        }
      )
      .subscribe();

    // Abonnement pour les documents classiques
    const documentsChannel = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          debouncedFetchStats();
        }
      )
      .subscribe();

    // Abonnement pour signease_activity
    const signeaseChannel = supabase
      .channel('signease_activity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signease_activity'
        },
        (payload) => {
          debouncedFetchStats();
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      supabase.removeChannel(doceaseChannel);
      supabase.removeChannel(signaturesChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(signeaseChannel);
    };
  }, [debouncedFetchStats]); // Seulement debouncedFetchStats qui est maintenant stable

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook pour les actualités
export const useNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      // URL officielle trouvée dans le XML fourni
      const TARGET_URL = 'https://www.fo-metaux.fr/syndication/actualite/';
      const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(TARGET_URL)}`;

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error("Flux RSS invalide ou inaccessible");
      }

      const items = data.items.slice(0, 10);

      const fetchedNews: NewsItem[] = items.map((item: any, index: number) => {
        let formattedDate = "Récemment";
        if (item.pubDate) {
          const dateStr = item.pubDate.replace(/-/g, '/');
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }
        }

        // Construction URL absolue si nécessaire
        let itemUrl = item.link;
        if (itemUrl && !itemUrl.startsWith('http')) {
          itemUrl = `https://www.fo-metaux.fr${itemUrl.startsWith('/') ? '' : '/'}${itemUrl}`;
        }

        return {
          id: index + 1,
          title: item.title,
          date: formattedDate,
          // Le XML ne contient pas de balise <category>, on utilise "Actualité" par défaut
          category: item.categories?.[0] || "Actualité",
          url: itemUrl
        };
      });

      setNews(fetchedNews);

    } catch (error) {
      console.warn("Erreur fetch news (mode secours avec données XML):", error);

      // Fallback data basé EXACTEMENT sur le contenu du XML fourni
      const fallbackNews: NewsItem[] = [
        {
          id: 93100601,
          title: "FO Renault Group salue l’alliance stratégique avec Ford : Un signal fort",
          date: "09 décembre 2025",
          category: "Industrie",
          url: "https://www.fo-metaux.fr/actualite/i/93100601/article-n-672"
        },
        {
          id: 93083144,
          title: "Les fauteuils roulants sont désormais remboursés à 100% par la Sécu !",
          date: "08 décembre 2025",
          category: "Social",
          url: "https://www.fo-metaux.fr/actualite/i/93083144/article-n-669"
        },
        {
          id: 93040635,
          title: "AMIPI : FO Métaux demande une intervention d’urgence",
          date: "05 décembre 2025",
          category: "Emploi",
          url: "https://www.fo-metaux.fr/actualite/i/93040635/amipi-fo-metaux-demande-une-intervention-d-urgence"
        },
        {
          id: 92933542,
          title: "POUR UNE TRANSITION JUSTE ET LOCALE ! Déclaration commune du CSF Automobile",
          date: "01 décembre 2025",
          category: "Automobile",
          url: "https://www.fo-metaux.fr/actualite/i/92933542/article-n-665"
        },
        {
          id: 92863664,
          title: "Votre newsletter FO Métaux évolue !",
          date: "27 novembre 2025",
          category: "Communication",
          url: "https://www.fo-metaux.fr/actualite/i/92863664/votre-newsletter-fo-metaux-evolue"
        },
        {
          id: 92819349,
          title: "ESSILORLUXOTTICA : GRÈVE POUR LE POUVOIR D’ACHAT",
          date: "25 novembre 2025",
          category: "Action",
          url: "https://www.fo-metaux.fr/actualite/i/92819349/article-n-662"
        }
      ];

      setNews(fallbackNews);
      setError(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, refreshing, error, refetch: fetchNews };
};

// Hook pour les liens (sidebar)
export const useLinks = () => {
  const [links, setLinks] = useState<ArchiveLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLinks(archiveLinks);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return { links, loading };
}