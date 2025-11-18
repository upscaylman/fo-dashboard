
import React from 'react';
import { FileText, Activity } from 'lucide-react';
import { DocumentTypeStat, WeeklyActivity } from '../../../types';

interface DocumentStatsViewProps {
  documentTypes: DocumentTypeStat[];
  activity: WeeklyActivity[];
}

const DocumentStatsView: React.FC<DocumentStatsViewProps> = ({ documentTypes, activity }) => {
  const maxActivity = Math.max(...activity.map(d => Math.max(d.letters, d.signatures)), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-[rgb(216,194,191)] p-6">
        <h3 className="font-semibold text-slate-900 mb-5 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Répartition par type de document</span>
        </h3>
        <div className="space-y-4">
          {documentTypes.map((doc, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{doc.type}</span>
                <span className="text-sm font-semibold text-slate-600">{doc.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`${doc.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${doc.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[rgb(216,194,191)] p-6">
        <h3 className="font-semibold text-slate-900 mb-5 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600" />
          <span>Activité des 7 derniers jours</span>
        </h3>
        <div className="space-y-3">
          {activity.map((day, idx) => (
            <div key={idx} className="flex items-center space-x-4">
              <div className="w-10 text-sm font-bold text-slate-600 text-right">{day.day}</div>
              <div className="flex-1 flex items-center space-x-1 group">
                <div className="flex-1 bg-purple-100 rounded-full h-7 relative overflow-hidden text-right pr-2 flex items-center justify-end">
                  <div
                    className="absolute top-0 left-0 bg-purple-200 h-7 rounded-full transition-all duration-500 group-hover:bg-purple-300"
                    style={{ width: `${(day.letters / maxActivity) * 100}%` }}
                  ></div>
                   <span className="text-xs font-bold text-purple-800 z-10">{day.letters}</span>
                </div>
                <div className="flex-1 bg-red-100 rounded-full h-7 relative overflow-hidden text-right pr-2 flex items-center justify-end">
                   <div
                    className="absolute top-0 left-0 bg-[#ffdad4] h-7 rounded-full transition-all duration-500 group-hover:brightness-95"
                    style={{ width: `${(day.signatures / maxActivity) * 100}%` }}
                  ></div>
                  <span className="text-xs font-bold text-red-800 z-10">{day.signatures}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-purple-200 rounded-full"></div>
            <span className="text-slate-600">Lettres</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#ffdad4] rounded-full"></div>
            <span className="text-slate-600">Signatures</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentStatsView;
