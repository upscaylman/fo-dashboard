import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose, duration = 3000 }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      // Allow animation to finish before unmounting
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isRendered) return null;

  const getStyles = (t: ToastType) => {
    switch (t) {
      case 'success':
        return 'bg-[#2f2f2f] text-white border-l-4 border-[#4caf50]';
      case 'error':
        return 'bg-[#2f2f2f] text-white border-l-4 border-[#f44336]';
      case 'warning':
        return 'bg-[#2f2f2f] text-white border-l-4 border-[#ff9800]';
      case 'info':
      default:
        return 'bg-[#2f2f2f] text-white border-l-4 border-[#0072ff]';
    }
  };

  const getIcon = (t: ToastType) => {
    switch (t) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  };

  return (
    <div 
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] 
        flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl
        min-w-[300px] max-w-[90vw]
        transition-all duration-300 ease-out transform
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
        ${getStyles(type)}
      `}
      role="alert"
    >
      <span className={`material-icons text-xl ${
        type === 'success' ? 'text-[#4caf50]' :
        type === 'error' ? 'text-[#f44336]' :
        type === 'warning' ? 'text-[#ff9800]' : 'text-[#0072ff]'
      }`}>
        {getIcon(type)}
      </span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <span className="material-icons text-sm text-gray-400">close</span>
      </button>
    </div>
  );
};

// Hook pour gérer les toasts
export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean } | null>(null);

  const showToast = (message: string, type: ToastType, duration?: number) => {
    console.log('🔔 showToast appelé:', message, type);
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    console.log('🔕 hideToast appelé');
    setToast(prev => prev ? { ...prev, isVisible: false } : null);
    setTimeout(() => setToast(null), 300);
  };

  return {
    toast,
    showToast,
    hideToast,
    showSuccess: (message: string, duration?: number) => {
      console.log('✅ showSuccess appelé:', message);
      showToast(message, 'success', duration);
    },
    showError: (message: string, duration?: number) => {
      console.log('❌ showError appelé:', message);
      showToast(message, 'error', duration);
    },
    showWarning: (message: string, duration?: number) => {
      console.log('⚠️ showWarning appelé:', message);
      showToast(message, 'warning', duration);
    },
    showInfo: (message: string, duration?: number) => {
      console.log('ℹ️ showInfo appelé:', message);
      showToast(message, 'info', duration);
    }
  };
};