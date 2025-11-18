import React from 'react';
import StatsTabs from '../components/dashboard/stats/StatsTabs';
import MainContent from '../components/dashboard/MainContent';
import Sidebar from '../components/dashboard/Sidebar';
import { useStats, useNews, useLinks } from '../hooks/useStats';

const DashboardPage: React.FC = () => {
    const { stats, loading: statsLoading, error: statsError } = useStats();
    const { news, loading: newsLoading, refreshing: newsRefreshing } = useNews();
    const { links, loading: linksLoading } = useLinks();

    // The global loading screen has been removed to allow progressive rendering.
    // Each component will now handle its own loading state.

    if (statsError) {
        return (
            <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200">
                <h3 className="text-lg font-semibold text-red-800">Erreur de chargement</h3>
                <p className="text-red-600 mt-2">{statsError}</p>
            </div>
        );
    }

    return (
        <>
            <StatsTabs stats={stats} loading={statsLoading} />
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <MainContent news={news} loading={newsLoading} refreshing={newsRefreshing} />
                </div>
                <div className="space-y-6">
                    <Sidebar archiveLinks={links} loading={linksLoading} />
                </div>
            </div>
        </>
    );
};

export default DashboardPage;