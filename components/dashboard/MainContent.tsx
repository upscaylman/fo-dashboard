
import React, { useState } from 'react';
import { FileText, PenTool, ChevronRight, Newspaper, Clock, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { NewsItem } from '../../types';

interface MainContentProps {
  news: NewsItem[];
  loading: boolean;
  refreshing?: boolean;
}

const monthMap: { [key: string]: number } = {
  'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
  'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
};

function parseFrenchDate(dateString: string): Date {
  const parts = dateString.toLowerCase().split(' ');
  if (parts.length < 3) return new Date(0);
  
  const day = parseInt(parts[0], 10);
  const monthName = parts[1];
  const year = parseInt(parts[2], 10);

  const month = monthMap[monthName];

  if (isNaN(day) || month === undefined || isNaN(year)) {
    return new Date(0);
  }

  return new Date(year, month, day);
}

type SortOrder = 'newest' | 'oldest';

const NewsSkeleton: React.FC = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-100 rounded-2xl animate-pulse">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="h-4 w-20 bg-slate-200 rounded"></div>
                            <div className="h-4 w-28 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-5 w-4/5 bg-slate-200 rounded"></div>
                    </div>
                    <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                </div>
            </div>
        ))}
    </div>
);

const MainContent: React.FC<MainContentProps> = ({ news, loading, refreshing }) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const sortedNews = [...news].sort((a, b) => {
    const dateA = parseFrenchDate(a.date);
    const dateB = parseFrenchDate(b.date);
    
    if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime();
    } else {
        return dateA.getTime() - dateB.getTime();
    }
  });

  return (
    <>
      {/* Actions principales */}
      <div className="bg-white rounded-3xl shadow-sm border border-[rgb(216,194,191)] overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600"/> Actions rapides
          </h2>
          <p className="text-slate-500 text-sm mt-1">Outils pour gérer vos documents</p>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <a href="https://fo-docgenerateur.netlify.app/" target="_blank" rel="noopener noreferrer" className="group block bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl border-2 border-transparent hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 rounded-xl text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #e42626 130%)', backgroundSize: '130%' }}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Créer une lettre automatique</h3>
                  <p className="text-sm text-slate-600 mt-1">Générez une lettre personnalisée via un formulaire simple.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a href="https://signeasy.netlify.app/#/dashboard" target="_blank" rel="noopener noreferrer" className="group block bg-red-50 hover:bg-red-100 p-6 rounded-2xl border-2 border-transparent hover:border-red-200 transition-all">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                <div className="bg-[#b71d1d] p-3.5 rounded-xl text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Signer un document PDF avec Signease</h3>
                  <p className="text-sm text-slate-600 mt-1">Signez électroniquement vos documents PDF en quelques clics.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </div>

      {/* Actualités récentes */}
      <div className="bg-white rounded-3xl shadow-sm border border-[rgb(216,194,191)] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Dernières actualités</h2>
              <div className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                fo-metaux.fr
                {refreshing && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Mise à jour..."></div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
              <button
                  onClick={() => setSortOrder('newest')}
                  className={`p-2 rounded-full transition-all duration-200 ${sortOrder === 'newest' ? 'bg-slate-200 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Trier du plus récent au plus ancien"
                  aria-label="Trier du plus récent au plus ancien"
                  aria-pressed={sortOrder === 'newest'}
              >
                  <ArrowDown className="w-5 h-5" />
              </button>
              <button
                  onClick={() => setSortOrder('oldest')}
                  className={`p-2 rounded-full transition-all duration-200 ${sortOrder === 'oldest' ? 'bg-slate-200 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Trier du plus ancien au plus récent"
                  aria-label="Trier du plus ancien au plus récent"
                  aria-pressed={sortOrder === 'oldest'}
              >
                  <ArrowUp className="w-5 h-5" />
              </button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <NewsSkeleton />
          ) : sortedNews.length > 0 ? (
            <div className="space-y-3">
              {sortedNews.map((newsItem) => (
                <a key={newsItem.id} href={newsItem.url} target="_blank" rel="noopener noreferrer" className="group block p-4 bg-slate-50 hover:bg-blue-50/80 rounded-2xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">{newsItem.category}</span>
                        <span className="text-xs text-slate-500 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5" />{newsItem.date}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{newsItem.title}</h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Newspaper className="w-12 h-12 mx-auto text-slate-300"/>
              <p className="text-slate-500 mt-4">Aucune actualité à afficher.</p>
            </div>
          )}
          {!loading && (
             <a href="https://www.fo-metaux.fr/actualite/c/0" target="_blank" rel="noopener noreferrer" className="mt-6 block w-full text-center px-4 py-2.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2f2f2f] focus:ring-offset-2">
              Voir toutes les actualités
            </a>
          )}
        </div>
      </div>
    </>
  );
};

export default MainContent;
