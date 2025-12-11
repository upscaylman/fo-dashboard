import React from 'react';
import { X, Globe } from 'lucide-react';
import { useMobileMenu } from '../../context/MobileMenuContext';
import Sidebar from '../dashboard/Sidebar';
import { ArchiveLink } from '../../types';

interface MobileSidebarProps {
  archiveLinks: ArchiveLink[];
  loading: boolean;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ archiveLinks, loading }) => {
  const { isOpen, closeMenu } = useMobileMenu();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-[320px] bg-[#FDF8F6] dark:bg-slate-950 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
           <div className="flex items-center gap-3">
              <div className="bg-fo-red p-2 rounded-xl shadow-lg shadow-red-500/20">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Menu</h2>
              </div>
           </div>
           <button 
             onClick={closeMenu}
             className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
           {/* Reuse existing Sidebar component */}
           <Sidebar archiveLinks={archiveLinks} loading={loading} />
           
           <div className="mt-8 text-center text-xs text-slate-400">
              <p>© 2025 Fédération FO Métaux</p>
              <p className="mt-1">Version Mobile 1.0</p>
           </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;