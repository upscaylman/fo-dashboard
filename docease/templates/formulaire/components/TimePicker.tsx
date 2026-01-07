import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  initialTime?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  isOpen,
  onClose,
  onTimeSelect,
  initialTime = ''
}) => {
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');

  // Parser l'heure initiale (format "HHhMM" ou "HH:MM")
  useEffect(() => {
    if (initialTime) {
      const match = initialTime.match(/(\d{1,2})[h:](\d{2})/);
      if (match) {
        setSelectedHour(parseInt(match[1], 10));
        setSelectedMinute(parseInt(match[2], 10));
      }
    }
  }, [initialTime, isOpen]);

  // Réinitialiser le mode à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setMode('hours');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const formattedHour = selectedHour.toString().padStart(2, '0');
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    onTimeSelect(`${formattedHour}h${formattedMinute}`);
    onClose();
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    // Passer automatiquement aux minutes après sélection de l'heure
    setTimeout(() => setMode('minutes'), 200);
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
  };

  // Calculer l'angle pour positionner les nombres sur le cercle
  const getPositionOnCircle = (index: number, total: number, radius: number) => {
    // Commencer à 12h (en haut) = -90 degrés
    const angle = ((index * 360) / total - 90) * (Math.PI / 180);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  // Calculer l'angle de l'aiguille
  const getHandAngle = () => {
    if (mode === 'hours') {
      // Pour les heures: 12 positions (0-11), 30° par heure
      const hourFor12 = selectedHour % 12;
      return (hourFor12 * 30) - 90;
    } else {
      // Pour les minutes: 60 positions, 6° par minute
      return (selectedMinute * 6) - 90;
    }
  };

  // Heures affichées (format 12h sur le cadran)
  const displayHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  
  // Minutes affichées (par 5)
  const displayMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  if (!isOpen) return null;

  const clockRadius = 85; // Rayon du cercle des nombres (aligné avec l'aiguille)
  const handLength = 85; // Longueur de l'aiguille (même que clockRadius)

  // Utiliser createPortal pour rendre le picker au niveau du body (au-dessus de tout)
  return createPortal(
    <>
      {/* Overlay sombre */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      
      {/* Modal TimePicker */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-[#2d2d2d] rounded-3xl shadow-2xl w-full max-w-[320px] pointer-events-auto animate-[scaleIn_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec l'heure sélectionnée */}
          <div className="bg-gradient-to-r from-[#a84383] to-[#c94a9a] p-4 text-white">
            <p className="text-xs opacity-80 mb-1 text-center">Sélectionner l'heure</p>
            <div className="flex items-center justify-center gap-1 text-4xl font-light">
              <button
                onClick={() => setMode('hours')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  mode === 'hours' 
                    ? 'bg-white/20' 
                    : 'hover:bg-white/10'
                }`}
              >
                {selectedHour.toString().padStart(2, '0')}
              </button>
              <span>:</span>
              <button
                onClick={() => setMode('minutes')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  mode === 'minutes' 
                    ? 'bg-white/20' 
                    : 'hover:bg-white/10'
                }`}
              >
                {selectedMinute.toString().padStart(2, '0')}
              </button>
            </div>
            
            {/* Toggle AM/PM pour les heures */}
            {mode === 'hours' && (
              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={() => setSelectedHour(selectedHour % 12)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedHour < 12 
                      ? 'bg-white/20' 
                      : 'hover:bg-white/10 opacity-70'
                  }`}
                >
                  Matin (0-11h)
                </button>
                <button
                  onClick={() => setSelectedHour((selectedHour % 12) + 12)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedHour >= 12 
                      ? 'bg-white/20' 
                      : 'hover:bg-white/10 opacity-70'
                  }`}
                >
                  Après-midi (12-23h)
                </button>
              </div>
            )}
          </div>

          {/* Horloge ronde */}
          <div className="p-4 flex flex-col items-center">
            <div 
              className="relative rounded-full bg-gray-100 dark:bg-[#3d3d3d] border-4 border-gray-200 dark:border-gray-600"
              style={{ width: 240, height: 240 }}
            >
              {/* Centre de l'horloge */}
              <div 
                className="absolute bg-[#a84383] rounded-full z-20 shadow-lg"
                style={{
                  width: 14,
                  height: 14,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              
              {/* Aiguille */}
              <div
                className="absolute origin-left z-10 transition-transform duration-200"
                style={{
                  width: handLength,
                  height: 4,
                  backgroundColor: '#a84383',
                  left: '50%',
                  top: '50%',
                  transform: `translateY(-50%) rotate(${getHandAngle()}deg)`,
                  borderRadius: '0 4px 4px 0'
                }}
              >
                {/* Bout de l'aiguille (cercle qui englobe le nombre) */}
                <div 
                  className="absolute bg-[#a84383] rounded-full shadow-lg"
                  style={{
                    width: 44,
                    height: 44,
                    right: -22,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              </div>

              {/* Nombres sur le cadran */}
              {mode === 'hours' ? (
                // Affichage des heures
                displayHours.map((hour, index) => {
                  const pos = getPositionOnCircle(index, 12, clockRadius);
                  const actualHour = selectedHour >= 12 
                    ? (hour === 12 ? 12 : hour + 12) 
                    : (hour === 12 ? 0 : hour);
                  const isSelected = selectedHour === actualHour || 
                    (selectedHour === 0 && hour === 12) || 
                    (selectedHour === 12 && hour === 12);
                  
                  return (
                    <button
                      key={hour}
                      onClick={() => handleHourSelect(
                        selectedHour >= 12 
                          ? (hour === 12 ? 12 : hour + 12) 
                          : (hour === 12 ? 0 : hour)
                      )}
                      className={`absolute flex items-center justify-center rounded-full z-30 text-sm font-semibold transition-all duration-150 w-9 h-9 -ml-[18px] -mt-[18px] active:scale-95 ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36] hover:text-[#a84383] dark:hover:text-[#e062b1]'
                      }`}
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `calc(50% + ${pos.y}px)`
                      }}
                    >
                      {hour}
                    </button>
                  );
                })
              ) : (
                // Affichage des minutes
                displayMinutes.map((minute, index) => {
                  const pos = getPositionOnCircle(index, 12, clockRadius);
                  const isSelected = selectedMinute === minute;
                  
                  return (
                    <button
                      key={minute}
                      onClick={() => handleMinuteSelect(minute)}
                      className={`absolute flex items-center justify-center rounded-full z-30 text-sm font-semibold transition-all duration-150 w-9 h-9 -ml-[18px] -mt-[18px] active:scale-95 ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36] hover:text-[#a84383] dark:hover:text-[#e062b1]'
                      }`}
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `calc(50% + ${pos.y}px)`
                      }}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  );
                })
              )}
            </div>

            {/* Ajustement fin pour les minutes */}
            {mode === 'minutes' && (
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => setSelectedMinute((selectedMinute - 1 + 60) % 60)}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3d3d3d] text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36] hover:text-[#a84383] dark:hover:text-[#e062b1] transition-all active:scale-95"
                >
                  <span className="material-icons text-lg">remove</span>
                </button>
                <span className="text-base font-medium text-gray-600 dark:text-gray-300 w-14 text-center">
                  :{selectedMinute.toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => setSelectedMinute((selectedMinute + 1) % 60)}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3d3d3d] text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36] hover:text-[#a84383] dark:hover:text-[#e062b1] transition-all active:scale-95"
                >
                  <span className="material-icons text-lg">add</span>
                </button>
              </div>
            )}
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
