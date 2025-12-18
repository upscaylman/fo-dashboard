import React, { useState, useEffect } from 'react';
import { LayoutGrid, Users, FileStack, LayoutDashboard, Calendar, ChevronDown, FileText, BarChart3, Edit3 } from 'lucide-react';
import GlobalStatsGrid from './GlobalStatsGrid';
import UserStatsTable from './UserStatsTable';
import AnalyticsView from './AnalyticsView';
import DoceaseDocumentsTable from './DoceaseDocumentsTable';
import SigneaseActivityTable from './SigneaseActivityTable';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity } from '../../../types';
import { Skeleton } from '../../ui/Skeleton';
import { usePermissions } from '../../../hooks/usePermissions';

type StatsTab = 'global' | 'users' | 'types' | 'docease' | 'signease';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';

interface StatsTabsProps {
    stats: {
        global: GlobalStat[];
        users: UserStat[];
        documentTypes: DocumentTypeStat[];
        activity: WeeklyActivity[];
    } | null;
    loading: boolean;
    activeTab?: StatsTab;
    onTabChange?: (tab: StatsTab) => void;
}

const StatsSkeleton: React.FC = () => (
    <div className="space-y-8 w-full max-w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 shrink-0 ml-8">
           <Skeleton className="w-16 h-16 rounded-2xl" />
           <div className="space-y-2">
               <Skeleton className="h-8 w-48 rounded-lg" />
               <Skeleton className="h-4 w-64 rounded-md" />
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
             <Skeleton className="h-10 w-40 rounded-full" />
             <Skeleton className="h-10 w-64 rounded-full" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-md3-sm h-[180px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <Skeleton className="w-16 h-6 rounded-full" />
              </div>
              <div className="space-y-2">
                  <Skeleton className="w-24 h-10 rounded-lg" />
                  <Skeleton className="w-32 h-4 rounded-md" />
                  <Skeleton className="w-full h-3 rounded-md mt-2 opacity-50" />
              </div>
          </div>
        ))}
      </div>
    </div>
);

const StatsTabs: React.FC<StatsTabsProps> = ({ stats, loading, activeTab, onTabChange }) => {
  const { isAdmin, isSuperAdmin } = usePermissions();
  
  // Si l'utilisateur n'est pas admin, on démarre sur l'onglet "Salariés"
  const defaultTab = (isAdmin || isSuperAdmin) ? 'global' : 'users';
  const [internalTab, setInternalTab] = useState<StatsTab>(activeTab || defaultTab);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchroniser avec l'onglet externe si fourni
  useEffect(() => {
    if (activeTab !== undefined) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const handleTabChange = (tab: StatsTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Simulation de rechargement des données lors du changement de date
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value as TimeRange;
      setTimeRange(newValue);
      setIsRefreshing(true);
      // Faux délai réseau pour l'UX
      setTimeout(() => setIsRefreshing(false), 600);
  };

  const isLoading = loading || isRefreshing;

  if (loading || !stats) return <StatsSkeleton />;

  // Définition des onglets avec couleurs
  interface TabConfig {
    id: string;
    label: string;
    icon: typeof LayoutGrid;
    color?: string;
    bgColor?: string;
    group?: 'stats' | 'tools';
  }

  const tabs: TabConfig[] = [
    ...(isAdmin || isSuperAdmin ? [{ id: 'global', label: 'Vue d\'ensemble', icon: LayoutGrid, color: 'text-blue-600', bgColor: 'bg-blue-500', group: 'stats' as const }] : []),
    { id: 'users', label: 'Salariés', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-500', group: 'stats' as const },
    { id: 'types', label: 'Analyse', icon: BarChart3, color: 'text-violet-600', bgColor: 'bg-violet-500', group: 'stats' as const },
    ...(isAdmin || isSuperAdmin ? [{ id: 'docease', label: 'DocEase', icon: FileText, color: 'text-[#a84383]', bgColor: 'bg-[#a84383]', group: 'tools' as const }] : []),
    ...(isAdmin || isSuperAdmin ? [{ id: 'signease', label: 'SignEase', icon: Edit3, color: 'text-orange-500', bgColor: 'bg-orange-500', group: 'tools' as const }] : []),
  ];

  // Séparer les onglets par groupe
  const statsTabs = tabs.filter(t => t.group === 'stats');
  const toolsTabs = tabs.filter(t => t.group === 'tools');

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col gap-4">
        
        {/* Ligne 1: Titre + Onglets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Titre avec Icône */}
          <div className="flex items-center gap-4 shrink-0 ml-8">
             <div className="p-3.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                 <LayoutDashboard className="w-8 h-8" />
             </div>
             <div>
                 <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tableau de bord</h2>
                 <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Bienvenue sur votre espace de gestion syndicale.</p>
             </div>
          </div>
          
          {/* Onglets de navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Filtre de Date - Style original, à gauche */}
            {internalTab !== 'types' && (
              <div className="relative group shrink-0">
                 <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer">
                     <div className="flex items-center gap-2 pointer-events-none">
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                        <span className="text-slate-500 dark:text-slate-300 text-xs">Période :</span>
                     </div>
                     <select
                        value={timeRange}
                        onChange={handleTimeRangeChange}
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer pr-6 pl-1"
                     >
                        <option className="text-slate-900 dark:text-slate-200 dark:bg-slate-900" value="week">7 derniers jours</option>
                        <option className="text-slate-900 dark:text-slate-200 dark:bg-slate-900" value="month">Ce mois-ci</option>
                        <option className="text-slate-900 dark:text-slate-200 dark:bg-slate-900" value="quarter">Ce trimestre</option>
                        <option className="text-slate-900 dark:text-slate-200 dark:bg-slate-900" value="year">Cette année</option>
                     </select>
                     <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                 </div>
              </div>
            )}
            
            {/* Onglets Statistiques */}
            <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm shrink-0">
              {statsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = internalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as StatsTab)}
                    className={`
                      flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive 
                        ? `${tab.bgColor} text-white shadow-lg` 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Onglets Outils (DocEase, SignEase) */}
            {toolsTabs.length > 0 && (
              <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm shrink-0">
                {toolsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = internalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as StatsTab)}
                      className={`
                        flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                        ${isActive 
                          ? `${tab.bgColor} text-white shadow-lg` 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="transition-all duration-500 ease-in-out">
        {isRefreshing ? (
             <StatsSkeleton />
        ) : (
            <>
                {internalTab === 'global' && (isAdmin || isSuperAdmin) && <GlobalStatsGrid stats={stats.global} />}
                {internalTab === 'users' && <UserStatsTable users={stats.users} />}
                {internalTab === 'types' && <AnalyticsView />}
                {internalTab === 'docease' && (isAdmin || isSuperAdmin) && <DoceaseDocumentsTable />}
                {internalTab === 'signease' && (isAdmin || isSuperAdmin) && <SigneaseActivityTable />}
            </>
        )}
      </div>
    </div>
  );
};

export default StatsTabs;