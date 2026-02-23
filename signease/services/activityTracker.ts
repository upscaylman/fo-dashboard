// Service pour envoyer les activités SignEase vers Supabase
// Permet le tracking sur le dashboard TeamEase

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

// Configuration Edge Function fallback (quand PostgREST est 503)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/db-proxy`;

// Tracker si PostgREST est en panne pour éviter des retries inutiles
let postgrestDown = false;
let postgrestDownSince = 0;
const POSTGREST_RETRY_AFTER_MS = 5 * 60 * 1000; // 5 minutes

// Configuration retry pour erreurs temporaires
const MAX_RETRIES = 1;
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
 * Insert via Edge Function db-proxy (fallback quand PostgREST est 503)
 */
const insertViaEdgeFunction = async (data: Record<string, unknown>): Promise<boolean> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        table: 'signease_activity',
        data,
        upsert: true
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`⚠️ Edge Function insert failed: ${response.status} ${errText}`);
      return false;
    }

    const result = await response.json();
    if (result.error) {
      console.warn('⚠️ Edge Function insert error:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('⚠️ Edge Function insert exception:', error);
    return false;
  }
};

/**
 * Enregistre une activité SignEase dans Supabase
 * Cette fonction est silencieuse - elle ne bloque pas l'utilisateur en cas d'erreur
 * Utilise PostgREST en priorité, puis Edge Function en fallback si 503
 */
export const trackActivity = async (data: ActivityData): Promise<boolean> => {
  if (!isSupabaseConfigured && !SUPABASE_URL) {
    console.warn('⚠️ Supabase non configuré - activité non trackée');
    return false;
  }

  const insertPayload = {
    user_email: data.userEmail,
    user_name: data.userName || data.userEmail.split('@')[0],
    action_type: data.actionType,
    document_name: data.documentName,
    document_url: data.documentUrl,
    recipient_email: data.recipientEmail,
    recipient_name: data.recipientName,
    envelope_id: data.envelopeId,
    metadata: data.metadata || {}
  };

  // Si PostgREST est connu comme down, utiliser directement Edge Function
  const shouldSkipPostgrest = postgrestDown && (Date.now() - postgrestDownSince < POSTGREST_RETRY_AFTER_MS);

  if (!shouldSkipPostgrest && supabase) {
    // Essayer PostgREST d'abord
    try {
      const { error } = await supabase
        .from('signease_activity')
        .insert(insertPayload);

      if (error) {
        if (isTransientError(error)) {
          console.log('⚠️ PostgREST 503 - basculement vers Edge Function...');
          postgrestDown = true;
          postgrestDownSince = Date.now();
          // Fallback vers Edge Function ci-dessous
        } else {
          console.error('❌ Erreur tracking activité:', error);
          return false;
        }
      } else {
        // Succès PostgREST
        postgrestDown = false;
        console.log(`✅ Activité trackée (PostgREST): ${data.actionType} - ${data.documentName || 'Sans titre'}`);
        return true;
      }
    } catch (error) {
      if (isTransientError(error)) {
        postgrestDown = true;
        postgrestDownSince = Date.now();
      } else {
        console.error('❌ Erreur tracking activité:', error);
        return false;
      }
    }
  }

  // Fallback: Edge Function
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const success = await insertViaEdgeFunction(insertPayload);
    if (success) {
      console.log(`✅ Activité trackée (Edge Function): ${data.actionType} - ${data.documentName || 'Sans titre'}`);
      return true;
    }
  }

  console.warn(`⚠️ Impossible de tracker: ${data.actionType} - aucun canal disponible`);
  return false;
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
