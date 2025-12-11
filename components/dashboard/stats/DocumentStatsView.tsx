import React from 'react';
import { FileText, Activity } from 'lucide-react';
import { DocumentTypeStat, WeeklyActivity } from '../../../types';
import { Card, CardHeader } from '../../ui/Card';

interface DocumentStatsViewProps {
  documentTypes: DocumentTypeStat[];
  activity: WeeklyActivity[];
}

const DocumentStatsView: React.FC<DocumentStatsViewProps> = ({ documentTypes, activity }) => {
  const maxActivity = Math.max(...activity.map(d => Math.max(d.letters, d.signatures)), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader 
            title="Typologie des documents" 
            subtitle="Répartition mensuelle"
            action={<div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><FileText className="w-5 h-5" /></div>}
        />
        <div className="space-y-6 mt-2">
          {documentTypes.map((doc, idx) => (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{doc.type}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{doc.count} docs ({doc.percentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`${doc.color} h-full rounded-full transition-all duration-1000 ease-out relative`}
                  style={{ width: `${doc.percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white opacity-20 bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
         <CardHeader 
            title="Volume d'activité" 
            subtitle="7 derniers jours"
            action={<div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400"><Activity className="w-5 h-5" /></div>}
        />
        <div className="flex items-end justify-between h-64 mt-4 px-2 space-x-2">
          {activity.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group gap-2">
                <div className="w-full flex flex-col justify-end gap-1 relative h-full">
                     {/* Signature Bar */}
                    <div 
                        className="w-full bg-red-400 dark:bg-red-500/80 rounded-t-lg rounded-b-sm opacity-90 group-hover:opacity-100 transition-all relative"
                        style={{ height: `${(day.signatures / maxActivity) * 60}%`, minHeight: '4px' }}
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {day.signatures} sign.
                        </div>
                    </div>
                     {/* Letter Bar */}
                    <div 
                        className="w-full bg-purple-500 dark:bg-purple-600/80 rounded-t-sm rounded-b-lg opacity-90 group-hover:opacity-100 transition-all relative"
                        style={{ height: `${(day.letters / maxActivity) * 60}%`, minHeight: '4px' }}
                    >
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {day.letters} let.
                        </div>
                    </div>
                </div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2">{day.day}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-600"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Lettres générées</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Signatures</span>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default DocumentStatsView;