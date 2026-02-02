import React, { useState, useEffect } from 'react';
import StatsTabs from '../components/dashboard/stats/StatsTabs';
import MainContent from '../components/dashboard/MainContent';
import Sidebar from '../components/dashboard/Sidebar';
import MobileSidebar from '../components/layout/MobileSidebar';
import ActiveUsersWidget from '../components/dashboard/ActiveUsersWidget';
import { useStats, useNews, useLinks, TimeRange } from '../hooks/useStats';
import { usePermissions } from '../hooks/usePermissions';
import { usePresence } from '../hooks/usePresence';

type StatsTab = 'global' | 'users' | 'types' | 'docease' | 'signease';

const DashboardPage: React.FC = () => {
    // État pour la période sélectionnée - partagé entre les composants
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    
    // Passer timeRange à useStats pour des données dynamiques
    const { stats, loading: statsLoading, error: statsError } = useStats(timeRange);
    const { news, loading: newsLoading, refreshing: newsRefreshing, error: newsError, refetch: refetchNews } = useNews();
    const { links, loading: linksLoading } = useLinks();
    const { isAdmin, isSuperAdmin } = usePermissions();
    const { updatePresence } = usePresence();
    
    // État pour l'onglet actif - utilisé pour masquer les sections inutiles
    const [activeTab, setActiveTab] = useState<StatsTab>(
        (isAdmin || isSuperAdmin) ? 'global' : 'users'
    );

    // Tracker le changement d'onglet
    useEffect(() => {
        const toolMap: { [key: string]: 'docease' | 'signease' | null } = {
            'global': null,
            'users': null,
            'types': null,
            'docease': 'docease',
            'signease': 'signease'
        };
        updatePresence(activeTab, toolMap[activeTab] || null);
    }, [activeTab, updatePresence]);

    // Seule la Vue d'ensemble (global) affiche les sections extras
    // Les autres onglets (Salariés, Analyse, DocEase) ont un affichage dédié
    const showExtraSections = activeTab === 'global';

    // The global loading screen has been removed to allow progressive rendering.
    // Each component will now handle its own loading state.
    // Note: statsError ne bloque plus le rendu - on affiche juste un avertissement

    return (
        <>
            {/* Bannière d'avertissement si service indisponible */}
            {statsError && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Service temporairement indisponible. Les donnees affichees peuvent etre incompletes.</span>
                    </div>
                </div>
            )}

            {/* Mobile Drawer */}
            <MobileSidebar archiveLinks={links} loading={linksLoading} />

            <StatsTabs 
                stats={stats} 
                loading={statsLoading} 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
            />
            
            {/* Section Outils Rapides + Contenu - Uniquement visible sur l'onglet "Vue d'ensemble" */}
            {showExtraSections && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Widget utilisateurs actifs - visible pour tous */}
                        <ActiveUsersWidget />
                        
                        <MainContent 
                            news={news} 
                            loading={newsLoading} 
                            refreshing={newsRefreshing} 
                            error={newsError}
                            onRetry={refetchNews}
                        />
                    </div>
                    
                    {/* Desktop Sidebar (Hidden on Mobile) */}
                    <div className="hidden lg:block space-y-6">
                        <Sidebar archiveLinks={links} loading={linksLoading} />
                    </div>
                </div>
            )}
        </>
    );
};

export default DashboardPage;