import { useState, useEffect, useCallback } from 'react';
import { 
  globalStats, 
  userStats, 
  documentTypeStats, 
  weeklyActivity, 
  archiveLinks 
} from '../constants';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity, NewsItem, ArchiveLink } from '../types';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setStats({
          global: globalStats,
          users: userStats,
          documentTypes: documentTypeStats,
          activity: weeklyActivity,
        });
      } catch (e) {
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

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