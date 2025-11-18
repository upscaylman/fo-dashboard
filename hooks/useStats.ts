import { useState, useEffect } from 'react';
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

// This hook simulates fetching dashboard stats.
export const useStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load immediately without artificial delay
    try {
      setStats({
        global: globalStats,
        users: userStats,
        documentTypes: documentTypeStats,
        activity: weeklyActivity,
      });
      setLoading(false);
    } catch (e) {
      setError("Failed to load stats data.");
      setLoading(false);
    }
  }, []);

  return { stats, loading, error };
};

// This hook provides news content by fetching and parsing the official RSS feed or HTML page.
export const useNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      // Set fallback data immediately for fast initial render
      // These will be replaced by real data if fetch succeeds
      const fallbackNews: NewsItem[] = [
        {
          id: 1,
          title: "Transition automobile : Des choix européens qui s'alignent sur les alertes de la filière",
          date: "05 novembre 2025",
          category: "Actualité",
          url: "https://www.fo-metaux.fr/actualite/c/0"
        },
        {
          id: 2,
          title: "AGIR : cap sur la phase 2",
          date: "04 novembre 2025",
          category: "Actualité",
          url: "https://www.fo-metaux.fr/actualite/c/0"
        },
        {
          id: 3,
          title: "Dénonciation de la suppression de 95 emplois chez GARANKA",
          date: "04 novembre 2025",
          category: "Actualité",
          url: "https://www.fo-metaux.fr/actualite/c/0"
        },
        {
          id: 4,
          title: "Négociations salariales dans la Métallurgie",
          date: "03 novembre 2025",
          category: "Actualité",
          url: "https://www.fo-metaux.fr/actualite/c/0"
        },
        {
          id: 5,
          title: "Congrès de la Fédération FO de la Métallurgie",
          date: "02 novembre 2025",
          category: "Actualité",
          url: "https://www.fo-metaux.fr/actualite/c/0"
        }
      ];

      // Show fallback data immediately - don't wait for network requests
      setNews(fallbackNews);
      setLoading(false);

      // Try to fetch fresh data in the background AFTER a short delay
      // This ensures the UI renders immediately
      const fetchFreshNews = async () => {
        setRefreshing(true);
        
        const RSS_URL = 'https://www.fo-metaux.fr/rss/c/0/actualite';
        const PROXY_URL = 'https://api.allorigins.win/get?url=';
        const TIMEOUT_MS = 3000; // 3 seconds max

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

          const rssResponse = await fetch(`${PROXY_URL}${encodeURIComponent(RSS_URL)}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (rssResponse.ok) {
            let rssText: string;
            try {
              const rssData = await rssResponse.json();
              rssText = rssData.contents || '';
            } catch (e) {
              rssText = await rssResponse.text();
            }

            if (rssText && !rssText.includes('Error') && !rssText.includes('404')) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(rssText, 'text/xml');
              const items = Array.from(doc.querySelectorAll('item')).slice(0, 5);
              
              if (items.length > 0) {
                const fetchedNews: NewsItem[] = items.map((item, index) => {
                  const title = item.querySelector('title')?.textContent?.trim() || 'Titre non disponible';
                  let url = item.querySelector('link')?.textContent?.trim() || '#';
                  const pubDate = item.querySelector('pubDate')?.textContent || '';
                  
                  url = url.replace(/\s+/g, '');
                  if (!url.startsWith('http')) {
                    url = `https://www.fo-metaux.fr${url}`;
                  }
                  
                  const date = pubDate 
                    ? new Date(pubDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) 
                    : 'Date inconnue';
                    
                  return {
                    id: index + 1,
                    title,
                    date,
                    category: item.querySelector('category')?.textContent?.trim() || 'Actualité',
                    url,
                  };
                });

                setNews(fetchedNews);
                setRefreshing(false);
                return;
              }
            }
          }
        } catch (error) {
          // Silently fail - we already have fallback data
        }
        
        // If RSS failed, just use fallback
        setRefreshing(false);
      };

      // Wait 500ms before trying to fetch (allows UI to render first)
      setTimeout(() => {
        fetchFreshNews();
      }, 500);
    };

    fetchNews();
    
    // Refresh news every 10 minutes (less frequent)
    const interval = setInterval(() => {
      fetchNews();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { news, loading, refreshing };
};


// This hook simulates fetching sidebar links.
export const useLinks = () => {
    const [links, setLinks] = useState<ArchiveLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
         // Load immediately without artificial delay
         setLinks(archiveLinks);
         setLoading(false);
    }, []);

    return { links, loading };
}