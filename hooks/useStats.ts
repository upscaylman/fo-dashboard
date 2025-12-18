import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { archiveLinks } from '../constants';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity, NewsItem, ArchiveLink } from '../types';
import { FileText, Edit3, User, Mail } from 'lucide-react';

interface DashboardStats {
  global: GlobalStat[];
  users: UserStat[];
  documentTypes: DocumentTypeStat[];
  activity: WeeklyActivity[];
}

// Hook pour les stats du dashboard
export const useStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les stats globales
      const [documentsCount, signaturesCount, usersCount, doceaseCount] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('signatures').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('docease_documents').select('id', { count: 'exact', head: true }),
      ]);

      // Calculer les utilisateurs actifs (avec activité dans les 30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Utilisateurs qui ont créé des documents DocEase
      const { data: activeDoceaseUsers } = await supabase
        .from('docease_documents')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Utilisateurs qui ont signé
      const { data: activeSignatureUsers } = await supabase
        .from('signatures')
        .select('user_id')
        .gte('signed_at', thirtyDaysAgo.toISOString());

      // Fusionner et dédupliquer les user_id
      const activeUserIds = new Set([
        ...(activeDoceaseUsers?.map(d => d.user_id).filter(Boolean) || []),
        ...(activeSignatureUsers?.map(s => s.user_id).filter(Boolean) || [])
      ]);

      const activeUsersCount = activeUserIds.size;

        // Compter les documents/signatures du mois en cours
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [monthDocuments, monthSignatures, monthDocease] = await Promise.all([
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString()),
          supabase
            .from('signatures')
            .select('id', { count: 'exact', head: true })
            .gte('signed_at', startOfMonth.toISOString()),
          supabase
            .from('docease_documents')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString()),
        ]);

        const globalStats: GlobalStat[] = [
          {
            label: 'Documents DocEase',
            value: String(doceaseCount.count || 0),
            icon: FileText,
            color: 'text-purple-700',
            bgColor: 'bg-purple-100',
            trend: `+${monthDocease.count || 0} ce mois`,
            description: 'Générés via DocEase'
          },
          {
            label: 'Signatures réalisées',
            value: String(signaturesCount.count || 0),
            icon: Edit3,
            color: 'text-red-700',
            bgColor: 'bg-red-100',
            trend: `+${monthSignatures.count || 0} ce mois`,
            description: 'PDFs signés via SignEase'
          },
          {
            label: 'Salariés actifs',
            value: String(activeUsersCount),
            icon: User,
            color: 'text-blue-700',
            bgColor: 'bg-blue-100',
            trend: `${activeUsersCount} actifs ce mois`,
            description: 'Utilisateurs avec activité récente (30 jours)'
          },
          {
            label: 'Envois par email',
            value: String(doceaseCount.count || 0),
            icon: Mail,
            color: 'text-indigo-700',
            bgColor: 'bg-indigo-100',
            trend: `+${monthDocease.count || 0} ce mois`,
            description: 'Documents envoyés automatiquement (DocEase + SignEase)'
          }
        ];

        // 2. Récupérer les stats par utilisateur
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            name,
            role,
            documents:documents(count),
            signatures:signatures(count),
            docease_docs:docease_documents(count)
          `)
          .limit(10);

        if (usersError) throw usersError;

        const userStats: UserStat[] = (usersData || []).map((user: any) => ({
          id: user.id,
          name: user.name,
          letters: (user.documents?.[0]?.count || 0) + (user.docease_docs?.[0]?.count || 0), // Cumul documents + docease
          signatures: user.signatures?.[0]?.count || 0,
          role: user.role_level || user.role || 'secretary',
        }));

        // 3. Récupérer les stats par type de document depuis docease_documents
        const { data: doceaseTypesData, error: doceaseTypesError } = await supabase
          .from('docease_documents')
          .select('document_type');

        if (doceaseTypesError) throw doceaseTypesError;

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

        // 4. Récupérer l'activité hebdomadaire réelle depuis docease_documents et signatures
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

            const [doceaseResult, signaturesResult] = await Promise.all([
              supabase
                .from('docease_documents')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', date.toISOString())
                .lt('created_at', nextDay.toISOString()),
              supabase
                .from('signatures')
                .select('id', { count: 'exact', head: true })
                .gte('signed_at', date.toISOString())
                .lt('signed_at', nextDay.toISOString()),
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
        setError(e.message || "Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchStats();

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
          console.log('🔄 Changement DocEase détecté, rafraîchissement des stats...', payload.eventType);
          fetchStats(); // Recharger les stats automatiquement
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
          console.log('🔄 Changement signatures détecté, rafraîchissement des stats...', payload.eventType);
          fetchStats();
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
          console.log('🔄 Changement documents détecté, rafraîchissement des stats...', payload.eventType);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(doceaseChannel);
      supabase.removeChannel(signaturesChannel);
      supabase.removeChannel(documentsChannel);
    };
  }, [fetchStats]);

  return { stats, loading, error };
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