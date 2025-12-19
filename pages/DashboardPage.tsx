import React, { useState, useEffect } from 'react';
import StatsTabs from '../components/dashboard/stats/StatsTabs';
import MainContent from '../components/dashboard/MainContent';
import Sidebar from '../components/dashboard/Sidebar';
import MobileSidebar from '../components/layout/MobileSidebar';
import ActiveUsersWidget from '../components/dashboard/ActiveUsersWidget';
import { useStats, useNews, useLinks } from '../hooks/useStats';
import { usePermissions } from '../hooks/usePermissions';
import { usePresence } from '../hooks/usePresence';

type StatsTab = 'global' | 'users' | 'types' | 'docease' | 'signease';

const DashboardPage: React.FC = () => {
    const { stats, loading: statsLoading, error: statsError } = useStats();
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

    if (statsError) {
        return (
            <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-800">Erreur de chargement</h3>
                <p className="text-red-600 mt-2">{statsError}</p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile Drawer */}
            <MobileSidebar archiveLinks={links} loading={linksLoading} />

            <StatsTabs 
                stats={stats} 
                loading={statsLoading} 
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            
            {/* Section Outils Rapides + Contenu - Toujours visible */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Widget utilisateurs actifs - visible uniquement pour admin/super_admin sur onglet global */}
                    {showExtraSections && (isAdmin || isSuperAdmin) && <ActiveUsersWidget />}
                    
                    <MainContent 
                        news={news} 
                        loading={newsLoading} 
                        refreshing={newsRefreshing} 
                        error={newsError}
                        onRetry={refetchNews}
                    />
                </div>
                
                {/* Desktop Sidebar (Hidden on Mobile) - Seulement sur onglet global */}
                {showExtraSections && (
                    <div className="hidden lg:block space-y-6">
                        <Sidebar archiveLinks={links} loading={linksLoading} />
                    </div>
                )}
            </div>
        </>
    );
};

export default DashboardPage;