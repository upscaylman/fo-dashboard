import { useState, useCallback } from 'react';
import { DocumentCache } from '../types';

/**
 * Hook personnalisé pour gérer le cache des documents
 */
export const useDocumentCache = () => {
  const [documentCache, setDocumentCache] = useState<Record<string, DocumentCache>>({});

  // Générer un hash des données pour détecter les changements
  const getDataHash = useCallback((data: Record<string, unknown>): string => {
    return JSON.stringify(data);
  }, []);

  // Vérifier si un document est en cache
  const isCached = useCallback((templateId: string, dataHash: string): boolean => {
    const cached = documentCache[templateId];
    return cached !== undefined && cached.dataHash === dataHash;
  }, [documentCache]);

  // Récupérer un document du cache
  const getCached = useCallback((templateId: string): DocumentCache | null => {
    return documentCache[templateId] || null;
  }, [documentCache]);

  // Mettre en cache un document
  const setCached = useCallback((templateId: string, cache: DocumentCache): void => {
    setDocumentCache(prev => ({
      ...prev,
      [templateId]: cache,
    }));
  }, []);

  // Vider le cache
  const clearCache = useCallback((): void => {
    setDocumentCache({});
  }, []);

  // Supprimer un document du cache
  const removeCached = useCallback((templateId: string): void => {
    setDocumentCache(prev => {
      const newCache = { ...prev };
      delete newCache[templateId];
      return newCache;
    });
  }, []);

  return {
    documentCache,
    getDataHash,
    isCached,
    getCached,
    setCached,
    clearCache,
    removeCached,
  };
};

