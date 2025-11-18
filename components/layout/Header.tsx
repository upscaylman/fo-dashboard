
import React from 'react';
import { Globe } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-[0_8px_32px_#00000026,inset_0_0_0_1px_#fff3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FO Métaux</h1>
              <p className="text-sm text-slate-500">Portail des secrétaires et militants</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">Secrétaire</p>
            <p className="text-xs text-slate-500">Connecté</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
