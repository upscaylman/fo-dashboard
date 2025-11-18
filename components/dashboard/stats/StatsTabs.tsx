
import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import GlobalStatsGrid from './GlobalStatsGrid';
import UserStatsTable from './UserStatsTable';
import DocumentStatsView from './DocumentStatsView';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity } from '../../../types';

type StatsTab = 'global' | 'users' | 'types';

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
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="h-7 w-64 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-10 w-full sm:w-auto bg-slate-200 rounded-xl animate-pulse" style={{minWidth: '260px'}}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-2xl p-6 h-40 animate-pulse">
            <div className="h-8 w-8 bg-slate-200 rounded-lg mb-4"></div>
            <div className="h-7 w-16 bg-slate-200 rounded mb-2"></div>
            <div className="h-5 w-32 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
);


const StatsTabs: React.FC<StatsTabsProps> = ({ stats, loading }) => {
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('global');

  if (loading) {
      return <StatsSkeleton />;
  }

  if (!stats) {
      return null;
  }

  const renderContent = () => {
    switch (activeStatsTab) {
      case 'global':
        return <GlobalStatsGrid stats={stats.global} />;
      case 'users':
        return <UserStatsTable users={stats.users} />;
      case 'types':
        return <DocumentStatsView documentTypes={stats.documentTypes} activity={stats.activity} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Statistiques d'utilisation</span>
        </h2>
        <div className="flex space-x-1 bg-white rounded-full p-1.5 border border-[rgb(216,194,191)] shadow-sm">
          {(['global', 'users', 'types'] as StatsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatsTab(tab)}
              className={`px-2 sm:px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 whitespace-nowrap ${
                activeStatsTab === tab
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'global' ? 'Vue globale' : tab === 'users' ? 'Par utilisateur' : 'Par type'}
            </button>
          ))}
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default StatsTabs;
