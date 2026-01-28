/**
 * API pour communiquer avec les webhooks n8n
 */

import { CONFIG, createHeaders, fetchWithTimeout } from './config';
import {
  FormData,
  DocumentGenerationResult,
  PdfConversionResult,
  EmailSendResult
} from './types';
import { MIME_TYPES } from './constants/ui';

/**
 * Convertir base64 en Blob
 */
export const base64ToBlob = (
  base64: string,
  mimeType: string = MIME_TYPES.word
): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array<number>(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Télécharger un fichier depuis un blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Générer un document Word via le webhook n8n
 */
export const generateWordDocument = async (data: any): Promise<DocumentGenerationResult> => {
  try {
    console.log('Génération du Word via webhook n8n:', data);

    const response = await fetchWithTimeout(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_URL, {
        'Content-Type': MIME_TYPES.json,
      }),
      body: JSON.stringify(data),
      mode: 'cors',
    }, CONFIG.REQUEST_TIMEOUT);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('Erreur serveur détails:', errorBody);
      throw new Error(`Erreur serveur ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as { data?: string; wordBase64?: string };
    console.log('Document Word généré avec succès');

    return {
      success: true,
      data: result.data || result.wordBase64 || ''
    };
  } catch (error) {
    console.error('Erreur génération Word:', error);

    // Message d'erreur plus explicite
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La requête a pris trop de temps (timeout). Veuillez réessayer.');
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Erreur de connexion au serveur. Vérifiez que n8n est accessible et que CORS est configuré correctement.');
    }

    throw error;
  }
};

/**
 * Convertir un document Word en PDF
 */
export const convertWordToPdf = async (
  wordBase64: string,
  filename: string = 'document'
): Promise<PdfConversionResult> => {
  try {
    console.log('🔄 Conversion Word -> PDF...');

    const response = await fetchWithTimeout(CONFIG.WEBHOOK_PDF_CONVERT_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_PDF_CONVERT_URL, { 'Content-Type': MIME_TYPES.json }),
      body: JSON.stringify({
        wordBase64,
        filename
      })
    }, CONFIG.REQUEST_TIMEOUT);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue');
      throw new Error(`Erreur serveur ${response.status}: ${errorText}`);
    }

    const result = await response.json() as { pdfBase64?: string };

    if (!result.pdfBase64) {
      throw new Error('Pas de PDF dans la réponse');
    }

    const pdfBlob = base64ToBlob(result.pdfBase64, MIME_TYPES.pdf);
    console.log('✅ PDF généré avec succès');

    return {
      success: true,
      blob: pdfBlob,
      filename: `${filename}.pdf`
    };
  } catch (error) {
    console.error('❌ Erreur conversion PDF:', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La conversion PDF a pris trop de temps. Veuillez réessayer.');
    }
    throw error;
  }
};

/**
 * Envoyer un email avec le document PDF
 */
export const sendEmailWithPdf = async (
  data: FormData,
  pdfBase64: string,
  customMessage?: string,
  filename?: string
): Promise<EmailSendResult> => {
  try {
    console.log('=== ENVOI EMAIL AVEC PDF ===');
    console.log('📄 pdfBase64 reçu:', pdfBase64 ? `OUI (${pdfBase64.length} caractères)` : 'NON');

    interface EmailPayload extends FormData {
      pdfFile: string;
      customEmailMessage?: string;
      pdfFilename?: string;
    }

    const payload: EmailPayload = {
      ...data,
      pdfFile: pdfBase64
    };

    if (customMessage) {
      payload.customEmailMessage = customMessage;
    }

    if (filename) {
      payload.pdfFilename = filename;
    }

    // DEBUG : Vérifier que pdfFile est bien dans le payload
    console.log('📦 Payload clés:', Object.keys(payload));
    console.log('📦 pdfFile dans payload:', payload.pdfFile ? `OUI (${payload.pdfFile.length} caractères)` : 'NON');

    const bodyString = JSON.stringify(payload);
    console.log('📦 Taille totale body:', bodyString.length, 'caractères');

    // Vérifier la taille du payload (ngrok limite à ~10MB)
    if (bodyString.length > CONFIG.MAX_PAYLOAD_SIZE) {
      throw new Error(`Le document est trop volumineux (${Math.round(bodyString.length / 1024 / 1024)}MB). Maximum: 8MB.`);
    }

    const response = await fetchWithTimeout(CONFIG.WEBHOOK_EMAIL_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_EMAIL_URL, { 'Content-Type': MIME_TYPES.json }),
      body: bodyString
    }, CONFIG.REQUEST_TIMEOUT);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur serveur'}`);
    }

    console.log('✅ Email envoyé avec succès');
    return {
      success: true,
      message: 'Email envoyé avec succès'
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('L\'envoi de l\'email a pris trop de temps. Veuillez réessayer.');
    }
    throw error;
  }
};

/**
 * Configuration du tracking DocEase vers le dashboard
 * NOTE: Le tracking est 100% optionnel - DocEase fonctionne sans Supabase
 */
const TRACKING_CONFIG = {
  url: 'https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook',
  apiKey: 'fo-metaux-docease-2025',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ',
  timeout: 5000 // 5 secondes max pour le tracking
};

/**
 * Envoyer un événement de génération de document au dashboard
 * @param documentType - Type du document (designation, courrier, etc.)
 * @param title - Titre/nom du fichier
 * @param metadata - Métadonnées additionnelles
 * @param fileBase64 - Contenu du fichier en base64 (optionnel, pour stockage)
 */
export const trackDocumentGeneration = async (
  documentType: string,
  title: string,
  metadata?: Record<string, any>,
  fileBase64?: string
): Promise<void> => {
  try {
    // Récupérer l'email utilisateur depuis le nouveau système d'auth DocEase
    let userEmail: string | null = null;
    let userName: string | null = null;
    
    // Essayer de récupérer depuis le nouveau système d'authentification
    const storedUser = localStorage.getItem('docease_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        userEmail = parsedUser.email;
        userName = parsedUser.name;
      } catch (e) {
        console.warn('Erreur parsing docease_user:', e);
      }
    }
    
    // Fallback : ancien système
    if (!userEmail) {
      userEmail = localStorage.getItem('userEmail');
    }
    
    // Fallback : utiliser l'email du délégué depuis les métadonnées
    if (!userEmail && metadata?.emailDelegue) {
      userEmail = metadata.emailDelegue;
    }
    
    // Fallback : utiliser contact@fo-metaux.fr par défaut
    if (!userEmail) {
      userEmail = 'contact@fo-metaux.fr';
      console.warn('⚠️ Tracking avec email par défaut: contact@fo-metaux.fr');
    }

    const payload: Record<string, any> = {
      user_email: userEmail,
      user_name: userName,
      document_type: documentType,
      title: title,
      metadata: {
        ...metadata,
        generated_by: userName || userEmail,
        generated_at: new Date().toISOString(),
        tool: 'docease'
      }
    };

    // Ajouter le fichier base64 si fourni (pour stockage dans Supabase Storage)
    if (fileBase64) {
      payload.file_base64 = fileBase64;
      console.log('📁 Fichier inclus pour stockage:', title, `(${fileBase64.length} caractères)`);
    }

    console.log('📤 Tracking document vers dashboard:', { 
      ...payload, 
      file_base64: fileBase64 ? `[${fileBase64.length} chars]` : undefined 
    });

    // Tracking avec timeout court - ne doit JAMAIS bloquer l'envoi d'email
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRACKING_CONFIG.timeout);
    
    try {
      const response = await fetch(TRACKING_CONFIG.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TRACKING_CONFIG.supabaseAnonKey}`,
          'Content-Type': MIME_TYPES.json,
          'x-api-key': TRACKING_CONFIG.apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Ne pas throw - juste logger
        console.warn(`⚠️ Tracking response: ${response.status}`);
      } else {
        const result = await response.json();
        console.log('✅ Document tracked on dashboard:', result);
        
        if (result.file_url) {
          console.log('📎 Fichier stocké:', result.file_url);
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Timeout ou erreur - ignorer silencieusement
      console.warn('⚠️ Tracking timeout ou erreur (ignoré)');
    }
  } catch (error) {
    // Ne pas bloquer l'utilisateur si le tracking échoue
    console.warn('⚠️ Erreur tracking (non bloquant):', error);
  }
};

/**
 * Envoyer un email avec le document Word
 */
export const sendEmailWithWord = async (
  data: FormData,
  wordBase64: string,
  customMessage?: string
): Promise<EmailSendResult> => {
  try {
    console.log('=== ENVOI EMAIL AVEC WORD ===');

    interface EmailPayload extends FormData {
      wordfile: string;
      customEmailMessage?: string;
    }

    const payload: EmailPayload = {
      ...data,
      wordfile: wordBase64
    };

    if (customMessage) {
      payload.customEmailMessage = customMessage;
    }

    const bodyString = JSON.stringify(payload);

    // Vérifier la taille du payload (ngrok limite à ~10MB)
    if (bodyString.length > CONFIG.MAX_PAYLOAD_SIZE) {
      throw new Error(`Le document est trop volumineux (${Math.round(bodyString.length / 1024 / 1024)}MB). Maximum: 8MB.`);
    }

    const response = await fetchWithTimeout(CONFIG.WEBHOOK_EMAIL_URL, {
      method: 'POST',
      headers: createHeaders(CONFIG.WEBHOOK_EMAIL_URL, { 'Content-Type': MIME_TYPES.json }),
      body: bodyString
    }, CONFIG.REQUEST_TIMEOUT);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur serveur'}`);
    }

    console.log('✅ Email envoyé avec succès');
    return {
      success: true,
      message: 'Email envoyé avec succès'
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('L\'envoi de l\'email a pris trop de temps. Veuillez réessayer.');
    }
    throw error;
  }
};

