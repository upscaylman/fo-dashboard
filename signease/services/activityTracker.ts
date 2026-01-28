// Service pour envoyer les activités SignEase vers Supabase
// Permet le tracking sur le dashboard FO Metaux

import { supabase, isSupabaseConfigured } from '../config/supabase';

export type ActivityType = 'document_created' | 'document_sent' | 'document_signed' | 'document_rejected';

interface ActivityData {
  userEmail: string;
  userName?: string;
  actionType: ActivityType;
  documentName?: string;
  documentUrl?: string;
  recipientEmail?: string;
  recipientName?: string;
  envelopeId?: string;
  metadata?: Record<string, any>;
}

// Configuration retry pour erreurs temporaires
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

// Vérifier si c'est une erreur temporaire Supabase
const isTransientError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; status?: number };
  return (
    err.code === 'PGRST002' ||
    err.status === 503 ||
    err.message?.includes('503') ||
    err.message?.includes('Service Unavailable') ||
    err.message?.includes('schema cache')
  );
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enregistre une activité SignEase dans Supabase
 * Cette fonction est silencieuse - elle ne bloque pas l'utilisateur en cas d'erreur
 * Inclut un retry automatique pour les erreurs temporaires (503, PGRST002)
 */
export const trackActivity = async (data: ActivityData): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase non configuré - activité non trackée');
    return false;
  }

  const executeWithRetry = async (attempt: number = 0): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('signease_activity')
        .insert({
          user_email: data.userEmail,
          user_name: data.userName || data.userEmail.split('@')[0],
          action_type: data.actionType,
          document_name: data.documentName,
          document_url: data.documentUrl,
          recipient_email: data.recipientEmail,
          recipient_name: data.recipientName,
          envelope_id: data.envelopeId,
          metadata: data.metadata || {}
        });

      if (error) {
        if (isTransientError(error) && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          return executeWithRetry(attempt + 1);
        }
        // Erreur non-temporaire ou max retries atteint - log silencieux
        if (!isTransientError(error)) {
          console.error('❌ Erreur tracking activité:', error);
        }
        return false;
      }

      console.log(`✅ Activité trackée: ${data.actionType} - ${data.documentName || 'Sans titre'}`);
      return true;
    } catch (error) {
      if (isTransientError(error) && attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        return executeWithRetry(attempt + 1);
      }
      if (!isTransientError(error)) {
        console.error('❌ Erreur tracking activité:', error);
      }
      return false;
    }
  };

  return executeWithRetry();
};

/**
 * Track: Document créé (brouillon)
 */
export const trackDocumentCreated = (userEmail: string, documentName: string, metadata?: Record<string, any>) => {
  return trackActivity({
    userEmail,
    actionType: 'document_created',
    documentName,
    metadata
  });
};

/**
 * Track: Document envoyé pour signature
 */
export const trackDocumentSent = (
  userEmail: string, 
  documentName: string, 
  recipientEmail: string, 
  recipientName?: string,
  envelopeId?: string
) => {
  return trackActivity({
    userEmail,
    actionType: 'document_sent',
    documentName,
    recipientEmail,
    recipientName,
    envelopeId
  });
};

/**
 * Track: Document signé
 */
export const trackDocumentSigned = (
  signerEmail: string, 
  documentName: string, 
  envelopeId?: string,
  documentUrl?: string,
  metadata?: Record<string, any>
) => {
  return trackActivity({
    userEmail: signerEmail,
    actionType: 'document_signed',
    documentName,
    documentUrl,
    envelopeId,
    metadata
  });
};

/**
 * Track: Document rejeté
 */
export const trackDocumentRejected = (
  signerEmail: string, 
  documentName: string, 
  reason?: string,
  envelopeId?: string
) => {
  return trackActivity({
    userEmail: signerEmail,
    actionType: 'document_rejected',
    documentName,
    envelopeId,
    metadata: { rejectionReason: reason }
  });
};
