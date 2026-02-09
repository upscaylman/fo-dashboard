import React, { useState, useEffect, useCallback } from 'react';
import { Input } from './Input';

interface DynamicAgendaPointsProps {
  /** Préfixe pour les IDs des champs (ex: 'ordreDuJour' pour ordreDuJour1, ordreDuJour2...) */
  fieldPrefix: string;
  /** Numéro de départ (1 pour Jour 1, 5 pour Jour 2) */
  startNumber: number;
  /** Label du groupe (ex: '1ère journée', '2ème journée') */
  dayLabel: string;
  /** Données du formulaire */
  data: Record<string, string>;
  /** Callback pour mettre à jour les données */
  onChange: (key: string, value: string) => void;
  /** Champs invalides */
  invalidFields?: Set<string>;
  /** Nombre minimum de points à afficher */
  minPoints?: number;
  /** Nombre maximum de points autorisés */
  maxPoints?: number;
}

export const DynamicAgendaPoints: React.FC<DynamicAgendaPointsProps> = ({
  fieldPrefix,
  startNumber,
  dayLabel,
  data,
  onChange,
  invalidFields,
  minPoints = 4,
  maxPoints = 12,
}) => {
  // Calculer le nombre initial de points en fonction des données existantes
  const getInitialPointCount = useCallback(() => {
    let count = minPoints;
    // Chercher le dernier point non vide
    for (let i = maxPoints; i >= 1; i--) {
      const fieldId = `${fieldPrefix}${startNumber + i - 1}`;
      if (data[fieldId] && data[fieldId].trim() !== '') {
        count = Math.max(count, i);
        break;
      }
    }
    return count;
  }, [data, fieldPrefix, startNumber, minPoints, maxPoints]);

  const [pointCount, setPointCount] = useState(getInitialPointCount);

  // Mettre à jour le nombre de points si les données changent
  useEffect(() => {
    const currentMax = getInitialPointCount();
    if (currentMax > pointCount) {
      setPointCount(currentMax);
    }
  }, [data, getInitialPointCount, pointCount]);

  const addPoint = () => {
    if (pointCount < maxPoints) {
      setPointCount(prev => prev + 1);
    }
  };

  const removePoint = (index: number) => {
    if (pointCount > minPoints) {
      // Effacer la valeur du dernier point
      const fieldId = `${fieldPrefix}${startNumber + pointCount - 1}`;
      onChange(fieldId, '');
      setPointCount(prev => prev - 1);
    }
  };

  const getOrdinalLabel = (num: number): string => {
    const ordinals = ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième', 'Huitième', 'Neuvième', 'Dixième', 'Onzième', 'Douzième'];
    return ordinals[num - 1] || `${num}ème`;
  };

  return (
    <div className="col-span-6 space-y-4">
      {/* Header avec titre et bouton ajouter */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[#a84383] dark:text-[#e062b1]">format_list_numbered</span>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Points à l'ordre du jour - {dayLabel}
          </h4>
        </div>
        {pointCount < maxPoints && (
          <button
            type="button"
            onClick={addPoint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#a84383] dark:text-[#e062b1] bg-[#ffecf8] dark:bg-[#4a1a36] hover:bg-[#ffd6f0] dark:hover:bg-[#5a2a46] border border-[#e062b1]/30 dark:border-[#e062b1]/50 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-icons text-lg">add</span>
            <span>Ajouter un point</span>
          </button>
        )}
      </div>

      {/* Grille des points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: pointCount }, (_, i) => {
          const pointNumber = i + 1;
          const fieldId = `${fieldPrefix}${startNumber + i}`;
          const isRequired = pointNumber === 1; // Seul le premier point est requis
          const isLastAddedPoint = pointNumber === pointCount && pointCount > minPoints;

          return (
            <div key={fieldId} className="relative group">
              <Input
                label={`Point ${pointNumber}`}
                type="text"
                placeholder={`${getOrdinalLabel(pointNumber)} point à l'ordre du jour`}
                icon="list"
                required={isRequired}
                value={data[fieldId] || ''}
                onChange={(e) => onChange(fieldId, e.target.value)}
                fieldId={fieldId}
                error={invalidFields?.has(fieldId) && isRequired ? `Point ${pointNumber} est requis` : undefined}
              />
              {/* Bouton supprimer pour les points ajoutés dynamiquement */}
              {isLastAddedPoint && (
                <button
                  type="button"
                  onClick={() => removePoint(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                  title="Supprimer ce point"
                >
                  <span className="material-icons text-sm">close</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Message d'information */}
      {pointCount >= maxPoints && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
          <span className="material-icons text-sm">info</span>
          Nombre maximum de points atteint ({maxPoints})
        </p>
      )}
    </div>
  );
};
