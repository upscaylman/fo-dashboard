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
import { TimeRange } from '../../../hooks/useStats';

type StatsTab = 'global' | 'users' | 'types' | 'docease' | 'signease';

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
    timeRange?: TimeRange;
    onTimeRangeChange?: (range: TimeRange) => void;
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

const StatsTabs: React.FC<StatsTabsProps> = ({ stats, loading, activeTab, onTabChange, timeRange = 'month', onTimeRangeChange }) => {
  const { isAdmin, isSuperAdmin } = usePermissions();
  
  // Si l'utilisateur n'est pas admin, on démarre sur l'onglet "Salariés"
  const defaultTab = (isAdmin || isSuperAdmin) ? 'global' : 'users';
  const [internalTab, setInternalTab] = useState<StatsTab>(activeTab || defaultTab);

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

  // Gérer le changement de période
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value as TimeRange;
      onTimeRangeChange?.(newValue);
  };

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto" data-stats-tabs>
            {/* Filtre de Date */}
            {internalTab !== 'types' && (
              <div className="relative group w-full sm:w-auto" data-period-selector>
                 <label className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer w-full sm:w-auto">
                     <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                     <span className="text-slate-500 dark:text-slate-300 text-xs">Période :</span>
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                       {timeRange === 'week' ? '7 jours' : timeRange === 'month' ? '30 jours' : timeRange === 'quarter' ? '3 mois' : '1 an'}
                     </span>
                     <select
                        value={timeRange}
                        onChange={handleTimeRangeChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     >
                        <option value="week">7 jours</option>
                        <option value="month">30 jours</option>
                        <option value="quarter">3 mois</option>
                        <option value="year">1 an</option>
                     </select>
                     <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                 </label>
              </div>
            )}
            
            {/* Conteneur des onglets - scrollable horizontalement sur mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              {/* Onglets Statistiques */}
              <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-1 sm:flex-none min-w-0">
                {statsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = internalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as StatsTab)}
                      className={`
                        flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-0
                        ${isActive 
                          ? `${tab.bgColor} text-white shadow-lg` 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                      `}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Onglets Outils (DocEase, SignEase) */}
              {toolsTabs.length > 0 && (
                <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-1 sm:flex-none min-w-0">
                  {toolsTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = internalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as StatsTab)}
                        className={`
                          flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-0
                          ${isActive 
                            ? `${tab.bgColor} text-white shadow-lg` 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                        `}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="transition-all duration-500 ease-in-out">
            <>
                {internalTab === 'global' && (isAdmin || isSuperAdmin) && <GlobalStatsGrid stats={stats.global} />}
                {internalTab === 'users' && <UserStatsTable users={stats.users} timeRange={timeRange} />}
                {internalTab === 'types' && <AnalyticsView />}
                {internalTab === 'docease' && (isAdmin || isSuperAdmin) && <DoceaseDocumentsTable />}
                {internalTab === 'signease' && (isAdmin || isSuperAdmin) && <SigneaseActivityTable />}
            </>
      </div>
    </div>
  );
};

export default StatsTabs;