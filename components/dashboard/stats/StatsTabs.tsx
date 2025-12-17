import React, { useState } from 'react';
import { LayoutGrid, Users, FileStack, LayoutDashboard, Calendar, ChevronDown, FileText } from 'lucide-react';
import GlobalStatsGrid from './GlobalStatsGrid';
import UserStatsTable from './UserStatsTable';
import DocumentStatsView from './DocumentStatsView';
import DoceaseDocumentsTable from './DoceaseDocumentsTable';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity } from '../../../types';
import { Skeleton } from '../../ui/Skeleton';
import { usePermissions } from '../../../hooks/usePermissions';

type StatsTab = 'global' | 'users' | 'types' | 'docease';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';

interface StatsTabsProps {
    stats: {
        global: GlobalStat[];
        users: UserStat[];
        documentTypes: DocumentTypeStat[];
        activity: WeeklyActivity[];
    } | null;
    loading: boolean;
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

const StatsTabs: React.FC<StatsTabsProps> = ({ stats, loading }) => {
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('global');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAdmin, isSuperAdmin } = usePermissions();

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

  const tabs = [
    { id: 'global', label: 'Vue d\'ensemble', icon: LayoutGrid },
    { id: 'users', label: 'Salariés', icon: Users },
    { id: 'types', label: 'Documents', icon: FileStack },
    ...(isAdmin || isSuperAdmin ? [{ id: 'docease', label: 'DocEase', icon: FileText }] : []),
  ];

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
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
        
        {/* Contrôles (Filtre Date + Tabs) */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full lg:w-auto">
          
          {/* Filtre de Date */}
          <div className="relative group w-full sm:w-auto">
             <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer w-full sm:w-auto justify-between sm:justify-start">
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

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1"></div>

          {/* Tabs de navigation */}
          <div className="inline-flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm w-full sm:w-auto overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStatsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatsTab(tab.id as StatsTab)}
                  className={`
                    flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-1 sm:flex-none
                    ${isActive 
                      ? 'bg-fo-dark text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-blue-300' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="transition-all duration-500 ease-in-out">
        {isRefreshing ? (
             <StatsSkeleton />
        ) : (
            <>
                {activeStatsTab === 'global' && <GlobalStatsGrid stats={stats.global} />}
                {activeStatsTab === 'users' && <UserStatsTable users={stats.users} />}
                {activeStatsTab === 'types' && <DocumentStatsView documentTypes={stats.documentTypes} activity={stats.activity} />}
                {activeStatsTab === 'docease' && (isAdmin || isSuperAdmin) && <DoceaseDocumentsTable />}
            </>
        )}
      </div>
    </div>
  );
};

export default StatsTabs;