import React from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardPage from './pages/DashboardPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fffbff] font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DashboardPage />
      </main>
      <Footer />
    </div>
  );
};

export default App;