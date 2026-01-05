import { useState, useCallback } from 'react';
import { FormData, TemplateDataStore, TemplateId } from '../types';

/**
 * Hook personnalisé pour gérer les données par template
 */
export const useTemplateData = () => {
  const [templateDataStore, setTemplateDataStore] = useState<TemplateDataStore>({});

  // Sauvegarder les données d'un template
  const saveTemplateData = useCallback((templateId: TemplateId, data: FormData): void => {
    console.log('💾 Sauvegarde des données pour:', templateId, data);
    setTemplateDataStore(prev => ({
      ...prev,
      [templateId]: data,
    }));
  }, []);

  // Récupérer les données d'un template
  const getTemplateData = useCallback((templateId: TemplateId): FormData | null => {
    return templateDataStore[templateId] || null;
  }, [templateDataStore]);

  // Vérifier si un template a des données sauvegardées
  const hasTemplateData = useCallback((templateId: TemplateId): boolean => {
    const data = templateDataStore[templateId];
    return data !== undefined && Object.keys(data).length > 0;
  }, [templateDataStore]);

  // Supprimer les données d'un template
  const clearTemplateData = useCallback((templateId: TemplateId): void => {
    setTemplateDataStore(prev => {
      const newStore = { ...prev };
      delete newStore[templateId];
      return newStore;
    });
  }, []);

  // Vider toutes les données
  const clearAllTemplateData = useCallback((): void => {
    setTemplateDataStore({});
  }, []);

  return {
    templateDataStore,
    saveTemplateData,
    getTemplateData,
    hasTemplateData,
    clearTemplateData,
    clearAllTemplateData,
  };
};

