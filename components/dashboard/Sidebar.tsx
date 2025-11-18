
import React from 'react';
import { Globe, Archive, ExternalLink, ChevronRight, Info } from 'lucide-react';
import { ArchiveLink } from '../../types';

interface SidebarProps {
  archiveLinks: ArchiveLink[];
  loading: boolean;
}

const SidebarLinksSkeleton: React.FC = () => (
    <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-100 rounded-2xl animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                    <div className="w-48 h-4 bg-slate-200 rounded"></div>
                </div>
                <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
            </div>
        ))}
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ archiveLinks, loading }) => {
  return (
    <>
      {/* Sites officiels */}
      <div className="bg-white rounded-3xl shadow-sm border border-[rgb(216,194,191)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900">Sites FO Métaux</h2>
        </div>
        <div className="p-4 space-y-2">
          <a href="https://www.fo-metaux.fr/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-colors group">
            <div className="flex items-center space-x-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-800">fo-metaux.fr</p>
                <p className="text-xs text-slate-500">Site principal</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
          </a>
          <a href="https://www.fo-metaux.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-colors group">
            <div className="flex items-center space-x-4">
              <Archive className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-semibold text-slate-800">fo-metaux.org</p>
                <p className="text-xs text-slate-500">Ressources & archives</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
          </a>
        </div>
      </div>

      {/* Archives et ressources */}
      <div className="bg-white rounded-3xl shadow-sm border border-[rgb(216,194,191)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80">
           <h2 className="text-lg font-bold text-slate-900">Archives & Ressources</h2>
        </div>
        <div className="p-4 space-y-2">
          {loading ? (
            <SidebarLinksSkeleton />
          ) : (
            archiveLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-purple-50 rounded-2xl transition-colors group">
                <div className="flex items-center space-x-4">
                  <link.icon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-800">{link.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))
          )}
        </div>
      </div>

      {/* Info technique */}
      <div className="bg-slate-100 rounded-3xl border border-[rgb(216,194,191)] p-5">
        <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
          <Info className="w-4 h-4" /> À savoir
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start"><span className="mr-2 mt-1 text-slate-400">•</span><span><strong>Automate n8n</strong> tourne en local</span></li>
          <li className="flex items-start"><span className="mr-2 mt-1 text-slate-400">•</span><span><strong>SignEasy</strong> est sur Netlify</span></li>
          <li className="flex items-start"><span className="mr-2 mt-1 text-slate-400">•</span><span>Les outils sont <strong>indépendants</strong></span></li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
