import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../ui/Card';
import { GlobalStat } from '../../../types';

interface GlobalStatsGridProps {
  stats: GlobalStat[];
}

const GlobalStatsGrid: React.FC<GlobalStatsGridProps> = ({ stats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Nombre de cartes visibles selon la taille d'écran (géré par CSS, ici on gère le mobile)
  const itemsPerView = 1; // Sur mobile, 1 carte à la fois dans le carrousel
  const totalSlides = stats.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Reprendre l'autoplay après 5 secondes
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <div className="space-y-4">
      {/* Version Desktop: Grille normale - adapte le nombre de colonnes selon le nombre de cartes */}
      <div className={`hidden md:grid gap-6 ${
        stats.length === 5 
          ? 'md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5' 
          : stats.length === 4 
            ? 'md:grid-cols-2 lg:grid-cols-4' 
            : 'md:grid-cols-2 lg:grid-cols-3'
      }`}>
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

      {/* Version Mobile: Carrousel */}
      <div className="md:hidden relative">
        {/* Container du carrousel */}
        <div className="overflow-hidden rounded-2xl">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="w-full flex-shrink-0 px-1">
                <Card className="relative overflow-hidden group hover:border-blue-200 dark:hover:border-slate-700 transition-colors">
                    {/* Background Decoration */}
                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 dark:opacity-5 ${stat.bgColor} transition-transform group-hover:scale-150 duration-500`}></div>
                    
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="flex items-start justify-between mb-4">
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
              </div>
            ))}
          </div>
        </div>

        {/* Boutons de navigation */}
        <button 
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
          aria-label="Précédent"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
          aria-label="Suivant"
        >
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Indicateurs (dots) */}
        <div className="flex justify-center gap-2 mt-4">
          {stats.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-6 bg-blue-500' 
                  : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`Aller à la carte ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalStatsGrid;