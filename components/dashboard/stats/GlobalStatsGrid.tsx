
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { GlobalStat } from '../../../types';

interface GlobalStatsGridProps {
  stats: GlobalStat[];
}

const GlobalStatsGrid: React.FC<GlobalStatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="relative bg-white rounded-2xl p-6 border border-[rgb(216,194,191)] hover:shadow-lg hover:border-[rgb(209,185,182)] transition-all duration-300 transform hover:-translate-y-1">
          <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <p className="absolute top-6 right-6 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{stat.trend}</p>
          <p className="text-4xl font-bold text-slate-900 tracking-tight mt-4">{stat.value}</p>
          <p className="text-base font-semibold text-slate-700 mt-1">{stat.label}</p>
          <p className="text-xs text-slate-500 mt-4">{stat.description}</p>
        </div>
      ))}
    </div>
  );
};

export default GlobalStatsGrid;
