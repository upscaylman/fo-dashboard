import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  initialDate?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const DatePicker: React.FC<DatePickerProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  initialDate = ''
}) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Parser la date initiale (format "DD mois YYYY")
  useEffect(() => {
    if (initialDate && isOpen) {
      const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ];
      const match = initialDate.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthIndex = months.findIndex(m => m.toLowerCase() === match[2].toLowerCase());
        const year = parseInt(match[3], 10);
        if (monthIndex !== -1) {
          const date = new Date(year, monthIndex, day);
          setSelectedDate(date);
          setViewMonth(monthIndex);
          setViewYear(year);
        }
      }
    } else if (isOpen && !initialDate) {
      setViewMonth(today.getMonth());
      setViewYear(today.getFullYear());
    }
  }, [initialDate, isOpen]);

  const handleConfirm = () => {
    if (selectedDate) {
      const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ];
      const formatted = `${selectedDate.getDate()} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
      onDateSelect(formatted);
    }
    onClose();
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calculer les jours du mois
  const getDaysInMonth = () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Jour de la semaine du 1er (0 = Dimanche, on veut Lundi = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];
    
    // Jours vides avant le 1er
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === viewMonth && 
           selectedDate.getFullYear() === viewYear;
  };

  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === viewMonth && 
           today.getFullYear() === viewYear;
  };

  if (!isOpen) return null;

  const days = getDaysInMonth();

  return createPortal(
    <>
      {/* Overlay sombre */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      
      {/* Modal DatePicker */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-[#2d2d2d] rounded-3xl shadow-2xl w-full max-w-[340px] pointer-events-auto animate-[scaleIn_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec la date sélectionnée */}
          <div className="bg-gradient-to-r from-[#a84383] to-[#c94a9a] p-4 text-white">
            <p className="text-xs opacity-80 mb-1 text-center">Sélectionner la date</p>
            <div className="text-center text-2xl font-light">
              {selectedDate ? (
                <>
                  <span className="font-semibold">{selectedDate.getDate()}</span>
                  {' '}
                  <span>{MONTHS[selectedDate.getMonth()].toLowerCase()}</span>
                  {' '}
                  <span>{selectedDate.getFullYear()}</span>
                </>
              ) : (
                <span className="opacity-60">Aucune date</span>
              )}
            </div>
          </div>

          {/* Navigation mois */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36] hover:text-[#a84383] dark:hover:text-[#e062b1] transition-all active:scale-95"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36] hover:text-[#a84383] dark:hover:text-[#e062b1] transition-all active:scale-95"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>

          {/* Calendrier */}
          <div className="p-4">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div 
                  key={day} 
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day !== null ? (
                    <button
                      onClick={() => handleDateSelect(day)}
                      className={`
                        w-full h-full rounded-full flex items-center justify-center
                        text-sm font-medium transition-all duration-150 active:scale-95
                        ${isSelected(day)
                          ? 'bg-[#a84383] text-white shadow-lg shadow-[#a84383]/30'
                          : isToday(day)
                            ? 'bg-[#ffecf8] dark:bg-[#4a1a36] text-[#a84383] dark:text-[#e062b1] font-semibold'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3d3d3d]'
                        }
                      `}
                    >
                      {day}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Bouton Aujourd'hui */}
            <button
              onClick={() => {
                setSelectedDate(today);
                setViewMonth(today.getMonth());
                setViewYear(today.getFullYear());
              }}
              className="w-full mt-3 py-2 text-sm font-medium text-[#a84383] dark:text-[#e062b1] hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 rounded-xl transition-all"
            >
              Aujourd'hui
            </button>
          </div>

          {/* Footer avec boutons */}
          <div className="flex border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-[#3d3d3d] transition-colors"
            >
              Annuler
            </button>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 text-[#a84383] dark:text-[#e062b1] font-semibold hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 transition-colors"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>,
    document.body
  );
};
