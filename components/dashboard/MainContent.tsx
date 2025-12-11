import React, { useState } from 'react';
import { FileText, Edit3, ChevronRight, Newspaper, Clock, Zap, ArrowDown, ArrowUp, FileSpreadsheet, Download, AlertCircle, RefreshCw, ExternalLink, Star } from 'lucide-react';
import { NewsItem } from '../../types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { Tooltip } from '../ui/Tooltip';
import { Skeleton } from '../ui/Skeleton';
import { useBookmarks } from '../../context/BookmarkContext';

interface MainContentProps {
  news: NewsItem[];
  loading: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  if (isNaN(day) || month === undefined || isNaN(year)) return new Date(0);
  return new Date(year, month, day);
}

const NewsSkeleton: React.FC = () => (
    <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-5 p-4 rounded-2xl border border-transparent">
                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                </div>
                <Skeleton className="w-8 h-8 rounded-full" />
            </div>
        ))}
    </div>
);

// Liste des modèles pointant vers le dossier /public/templates/
const templates = [
    { 
        id: 1, 
        name: "Liste Globale Destinataires", 
        type: "excel", 
        size: "Macro XLSM", 
        url: "/templates/LISTE GLOBALE DESTINATAIRES-REORGANISE.xlsm" 
    },
    { 
        id: 2, 
        name: "Modèle Désignation", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_designation.docx" 
    },
    { 
        id: 3, 
        name: "Modèle Négociation", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_negociation.docx" 
    },
    { 
        id: 4, 
        name: "Modèle Personnalisé", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_custom.docx" 
    },
    { 
        id: 5, 
        name: "Modèle Circulaire", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_circulaire.docx" 
    },
];

const MainContent: React.FC<MainContentProps> = ({ news, loading, refreshing, error, onRetry }) => {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { addToast } = useToast();
  const { toggleBookmark, isBookmarked } = useBookmarks();

  const handleDownload = (name: string) => {
    addToast(`Téléchargement de "${name}" lancé...`, 'success');
  };

  const sortedNews = [...news].sort((a, b) => {
    const dateA = parseFrenchDate(a.date);
    const dateB = parseFrenchDate(b.date);
    return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-8">
      
      {/* Section Actions Rapides */}
      <Card>
        <CardHeader 
            title="Outils Rapides" 
            subtitle="Accès direct à vos applications métiers"
            action={
                <Tooltip content="Applications principales">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full cursor-help"><Zap className="w-5 h-5 text-blue-600 dark:text-blue-400"/></div>
                </Tooltip>
            }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Action 1 */}
            <a href="https://fo-docease.netlify.app/" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[24px] p-6 text-white hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
                    <FileText className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">DocEase : Générateur de Lettres</h3>
                        <p className="text-purple-100 text-sm font-medium opacity-90">Sélectionnez votre modèle de lettre à générer</p>
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </div>
            </a>

             {/* Action 2 */}
            <a href="https://signeasy.netlify.app/#/dashboard" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-gradient-to-br from-rose-500 to-orange-600 rounded-[24px] p-6 text-white hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
                    <Edit3 className="w-32 h-32 -rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                         <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">SignEase : Signature Électronique</h3>
                        <p className="text-rose-100 text-sm font-medium opacity-90">Signer vos PDF en ligne</p>
                    </div>
                     <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </div>
            </a>
        </div>
      </Card>

      {/* Section Modèles & Documents */}
      <Card>
        <CardHeader 
            title="Modèles & Documents" 
            subtitle="Fichiers de référence à télécharger"
            action={<div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><Download className="w-5 h-5 text-slate-600 dark:text-slate-400"/></div>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((template) => {
                const isStarred = isBookmarked(template.id);
                return (
                <div 
                    key={template.id} 
                    className="flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md3-sm hover:border-slate-200 dark:hover:border-slate-600 transition-all group relative"
                >
                    <a 
                        href={template.url} 
                        download 
                        onClick={() => handleDownload(template.name)}
                        className="flex items-center flex-1 min-w-0 cursor-pointer"
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${template.type === 'word' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300'}`}>
                            {template.type === 'word' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors pr-8">{template.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wide">{template.type} • {template.size}</p>
                        </div>
                    </a>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleBookmark({
                                    id: template.id,
                                    type: 'template',
                                    title: template.name,
                                    url: template.url,
                                    subtitle: template.size
                                });
                            }}
                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors"
                        >
                            <Star className={`w-4 h-4 transition-transform active:scale-125 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <a 
                            href={template.url}
                            download
                            onClick={() => handleDownload(template.name)}
                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            )})}
        </div>
      </Card>

      {/* Actualités */}
      <Card>
        <CardHeader 
            title="Dernières actualités" 
            subtitle={
                <a href="https://www.fo-metaux.fr/actualite/c/0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                    Source: fo-metaux.fr
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    {refreshing && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>}
                </a>
            }
            action={
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                    <Tooltip content="Plus récents">
                     <button onClick={() => setSortOrder('newest')} className={`p-1.5 rounded-full transition-all ${sortOrder === 'newest' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <ArrowDown className="w-4 h-4" />
                     </button>
                    </Tooltip>
                    <Tooltip content="Plus anciens">
                     <button onClick={() => setSortOrder('oldest')} className={`p-1.5 rounded-full transition-all ${sortOrder === 'oldest' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <ArrowUp className="w-4 h-4" />
                     </button>
                    </Tooltip>
                </div>
            }
        />

        {loading ? (
            <NewsSkeleton />
          ) : error ? (
            <div className="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 mx-4 mb-4">
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 animate-bounce">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-red-900 dark:text-red-200 font-bold mb-1">Erreur de chargement</h3>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4 px-4">{error}</p>
                <button 
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 transition-all text-sm shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Réessayer
                </button>
            </div>
          ) : sortedNews.length > 0 ? (
            <div className="space-y-2">
              {sortedNews.map((newsItem) => {
                const isStarred = isBookmarked(newsItem.id);
                return (
                <div key={newsItem.id} className="group flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 relative">
                  {/* Icon Placeholder based on category */}
                  <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="hidden sm:flex flex-shrink-0 w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Newspaper className="w-6 h-6" />
                  </a>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <Badge variant="blue" size="sm">{newsItem.category}</Badge>
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {newsItem.date}
                      </span>
                    </div>
                    <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2 pr-8">
                        {newsItem.title}
                    </a>
                  </div>

                  <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={(e) => {
                            e.preventDefault();
                            toggleBookmark({
                                id: newsItem.id,
                                type: 'news',
                                title: newsItem.title,
                                url: newsItem.url,
                                subtitle: newsItem.date
                            });
                        }}
                        className="text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors"
                      >
                         <Star className={`w-4 h-4 transition-transform active:scale-125 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                      </a>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
              <Newspaper className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3"/>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune actualité disponible</p>
            </div>
          )}

          {!loading && !error && (
             <a href="https://www.fo-metaux.fr/actualite/c/0" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-center w-full py-3.5 bg-fo-dark dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95">
              Voir toutes les actualités
            </a>
          )}
      </Card>
    </div>
  );
};

export default MainContent;