import React from 'react';
import { Card } from '../../ui/Card';
import { GlobalStat } from '../../../types';

interface GlobalStatsGridProps {
  stats: GlobalStat[];
}

const GlobalStatsGrid: React.FC<GlobalStatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden group hover:border-blue-200 dark:hover:border-slate-700 transition-colors">
            {/* Background Decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 dark:opacity-5 ${stat.bgColor} transition-transform group-hover:scale-150 duration-500`}></div>
            
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-start justify-between mb-4">
                    {/* Dark mode adjustment: force opacity on bg, lighten text */}
                    <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} bg-opacity-50 dark:bg-opacity-10 dark:text-opacity-90`}>
                        <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center gap-1">
                        {stat.trend}
                    </span>
                </div>
                
                <div>
                    <h3 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">{stat.value}</h3>
                    <p className="font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{stat.description}</p>
                </div>
            </div>
        </Card>
      ))}
    </div>
  );
};

export default GlobalStatsGrid;