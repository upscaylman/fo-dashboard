import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4'
};

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = '#a84383',
  className = '' 
}) => {
  return (
    <div 
      className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin ${className}`}
      style={{ borderColor: `${color} transparent transparent transparent` }}
      role="status"
      aria-label="Chargement en cours"
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Chargement en cours...', 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-[scaleIn_0.3s_ease-out]">
        <Spinner size="xl" />
        <p id="loading-message" className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div 
      className={`bg-gray-200 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Chargement du contenu"
    />
  );
};

interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({ 
  message = 'Chargement...', 
  size = 'md' 
}) => {
  return (
    <div className="flex items-center gap-3 justify-center py-4" role="status">
      <Spinner size={size} />
      <span className="text-gray-600 font-medium">{message}</span>
    </div>
  );
};

/**
 * Skeleton de chargement complet pour DocEase
 * Simule la structure de l'application pendant le chargement
 */
export const AppSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5] dark:bg-[rgb(18,18,18)]">
      {/* Skeleton Sidebar */}
      <aside className="hidden md:flex w-[280px] bg-white dark:bg-[rgb(30,30,30)] border-r border-gray-100 dark:border-gray-800 flex-col">
        {/* Header Sidebar */}
        <div className="h-20 flex items-center gap-4 px-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="w-24 h-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        
        {/* Templates Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
              <div className="aspect-[4/3] w-full rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
              <div className="h-4 w-3/4 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
              <div className="h-3 w-1/2 mx-auto rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <header className="h-20 bg-white/80 dark:bg-[#1e1e1e]/80 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div>
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
              <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse hidden sm:block" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-28 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="hidden md:block w-28 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-hidden p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            {/* Steps Skeleton */}
            <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="hidden md:block w-20 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  {i < 3 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
                </div>
              ))}
            </div>

            {/* Form Card Skeleton */}
            <div className="bg-white dark:bg-[rgb(30,30,30)] rounded-3xl shadow-xl p-6 md:p-8">
              {/* Step Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div>
                  <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
                  <div className="h-3 w-60 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                </div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={i === 5 ? 'md:col-span-2' : ''}>
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
                    <div className="h-12 w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Navigation Buttons Skeleton */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="w-32 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-32 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          </div>
        </main>

        {/* Footer Skeleton */}
        <footer className="bg-[#2a2a2a] py-6 px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-3 w-32 rounded bg-gray-600 animate-pulse" />
              <div className="h-3 w-40 rounded bg-gray-600 animate-pulse" />
            </div>
            <div className="h-6 w-24 rounded-full bg-gray-600 animate-pulse" />
          </div>
        </footer>
      </div>
    </div>
  );
};
