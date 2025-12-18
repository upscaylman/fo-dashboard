import React from 'react';
import { Globe, Archive, ExternalLink, ChevronRight, Info, Link as LinkIcon, Star, FileText, Newspaper } from 'lucide-react';
import { ArchiveLink } from '../../types';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { Skeleton } from '../ui/Skeleton';
import { useBookmarks } from '../../context/BookmarkContext';
import { useDoceaseStatus } from '../../hooks/useDoceaseStatus';

interface SidebarProps {
  archiveLinks: ArchiveLink[];
  loading: boolean;
}

const LinkItem = ({ href, icon: Icon, title, subtitle, colorClass }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass} bg-opacity-10 dark:bg-opacity-20 text-opacity-100`}>
            <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')} dark:text-opacity-90`} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
        </div>
        <Tooltip content="Ouvrir le site">
            <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
        </Tooltip>
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ archiveLinks, loading }) => {
  const { bookmarks, removeBookmark } = useBookmarks();
  const { isOnline, isChecking } = useDoceaseStatus();

  return (
    <div className="space-y-6">
      
      {/* Section Favoris (Bookmarks) */}
      <Card className="!p-0 overflow-hidden border-amber-200 dark:border-amber-900/30">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500"/>
                Mes Favoris
                <span className="ml-auto text-xs font-normal px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full text-slate-500">{bookmarks.length}</span>
            </h2>
        </div>
        <div className="p-2">
            {bookmarks.length === 0 ? (
                <div className="text-center py-6 px-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Star className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aucun favori pour le moment.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cliquez sur l'étoile à côté d'un document ou d'une actu pour l'épingler ici.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {bookmarks.map((item) => (
                        <div key={item.id} className="group relative flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                             <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                 item.type === 'template' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                 item.type === 'news' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                 'bg-slate-100 text-slate-600'
                             }`}>
                                 {item.type === 'template' ? <FileText className="w-4 h-4" /> : <Newspaper className="w-4 h-4" />}
                             </div>
                             
                             <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                     {item.title}
                                 </p>
                                 {item.subtitle && <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>}
                             </a>

                             <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeBookmark(item.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-all"
                                title="Retirer des favoris"
                             >
                                 <Star className="w-4 h-4 fill-current" />
                             </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
                Ecosystème FO
            </h2>
        </div>
        <div className="p-4 space-y-1">
            <LinkItem 
                href="https://www.fo-metaux.fr/"
                icon={Globe}
                title="fo-metaux.fr"
                subtitle="Site officiel fédéral"
                colorClass="bg-blue-600 text-blue-600 dark:text-blue-400"
            />
            <LinkItem 
                href="https://www.fo-metaux.org/"
                icon={Archive}
                title="fo-metaux.org"
                subtitle="Ressources & Archives"
                colorClass="bg-indigo-600 text-indigo-600 dark:text-indigo-400"
            />
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400"/>
                Ressources Utiles
            </h2>
        </div>
        <div className="p-4 flex flex-col gap-1">
          {loading ? (
             [...Array(5)].map((_, i) => (
                 <div key={i} className="flex items-center gap-3 p-3">
                     <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                     <Skeleton className="h-4 w-full rounded-md" />
                 </div>
             ))
          ) : (
            archiveLinks.map((link, idx) => (
                <Tooltip key={idx} content={link.name} position="top" className="w-full">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group w-full">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors flex-shrink-0">
                                <link.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-900 dark:group-hover:text-purple-200 truncate">{link.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 flex-shrink-0" />
                    </a>
                </Tooltip>
            ))
          )}
        </div>
      </Card>

      <div className="bg-slate-900 dark:bg-slate-800 rounded-[24px] p-6 text-slate-300 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Info className="w-24 h-24" />
        </div>
        <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2 relative z-10">
          <Info className="w-4 h-4 text-blue-400" /> Info Technique
        </h3>
        <ul className="space-y-3 text-xs relative z-10">
          <li className="flex items-center gap-2">
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                isOnline === null
                  ? 'bg-gray-500 opacity-50'
                  : isChecking
                    ? 'bg-yellow-500 animate-pulse'
                    : isOnline
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-red-500'
              }`}
              title={
                isOnline === null
                  ? 'Initialisation...'
                  : isChecking
                    ? 'Vérification...'
                    : isOnline
                      ? 'Serveur en ligne'
                      : 'Serveur hors ligne'
              }
            ></div>
            <strong className="text-white">
                <a href="https://fo-docease.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">DocEase</a>
            </strong> : 
            <span className="font-mono text-[10px]">
              {isOnline === null ? (
                <span className="opacity-50">...</span>
              ) : isChecking ? (
                'Vérification...'
              ) : isOnline ? (
                <span className="text-green-400">En ligne</span>
              ) : (
                <span className="text-red-400">Hors ligne</span>
              )}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> 
            <strong className="text-white">
                <a href="https://signeasy.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">SignEase</a>
            </strong> : <span className="font-mono text-[10px] text-green-400">En ligne</span>
          </li>
          <li className="flex items-center gap-2 pt-2 border-t border-white/10">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px]">Backend ngrok · Vérification auto toutes les 30s</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;