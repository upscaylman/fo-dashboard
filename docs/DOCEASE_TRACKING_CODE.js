// ================================================
// CODE À AJOUTER DANS DOCEASE
// ================================================
// Ce code envoie un webhook vers le dashboard FO Métaux
// chaque fois qu'un document est généré

// ================================================
// 1. CONFIGURATION
// ================================================
const WEBHOOK_CONFIG = {
  url: 'https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook',
  apiKey: 'fo-metaux-docease-2025' // Clé de sécurité
};

// ================================================
// 2. FONCTION DE TRACKING
// ================================================
/**
 * Envoie les informations du document généré vers le dashboard
 * @param documentData - Données du document généré
 * @param documentData.userEmail - Email de l'utilisateur
 * @param documentData.type - Type de document (ex: "designation")
 * @param documentData.title - Titre du document
 * @param documentData.template - Template utilisé
 * @param documentData.wordCount - Nombre de mots (optionnel)
 * @param documentData.file_base64 - IMPORTANT: Le fichier PDF en base64 pour permettre le téléchargement
 */
async function trackDocumentGeneration(documentData) {
  try {
    const payload = {
      user_email: documentData.userEmail, // Email de l'utilisateur connecté
      document_type: documentData.type,   // Ex: "Lettre de réclamation"
      title: documentData.title,          // Titre du document
      metadata: {
        template_used: documentData.template,
        word_count: documentData.wordCount,
        generated_at: new Date().toISOString(),
        // Ajouter d'autres métadonnées si besoin
      }
    };
    
    // ⚠️ IMPORTANT: Inclure le fichier base64 pour le téléchargement
    // Le fichier sera stocké dans Supabase Storage et accessible depuis le dashboard
    if (documentData.file_base64) {
      payload.file_base64 = documentData.file_base64;
    }
    
    const response = await fetch(WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': WEBHOOK_CONFIG.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Document tracked:', result);
      if (result.file_url) {
        console.log('📁 Fichier stocké:', result.file_url);
      }
      return result;
    } else {
      console.warn('⚠️ Tracking failed:', response.status, await response.text());
      return null;
    }
  } catch (error) {
    console.error('❌ Tracking error:', error);
    // Ne pas bloquer la génération si le tracking échoue
    return null;
  }
}

// ================================================
// 3. EXEMPLE D'INTÉGRATION (AVEC FICHIER PDF)
// ================================================

// Option A : Génération et envoi avec le PDF base64
async function generateAndTrackDocument(formData) {
  try {
    // 1. Générer le document Word (logique existante)
    const wordDocument = await yourExistingGenerationLogic(formData);
    
    // 2. Convertir en PDF (si nécessaire)
    const pdfBase64 = await convertToPdfBase64(wordDocument);
    
    // 3. Tracker la génération AVEC LE FICHIER PDF
    await trackDocumentGeneration({
      userEmail: getCurrentUserEmail(),
      type: formData.documentType,
      title: formData.documentTitle || `Document ${formData.documentType}.pdf`,
      template: formData.templateId,
      wordCount: wordDocument.wordCount || 0,
      file_base64: pdfBase64 // ⚠️ IMPORTANT: Le PDF en base64
    });
    
    // 4. Télécharger/Afficher le document
    return wordDocument;
    
  } catch (error) {
    console.error('Document generation error:', error);
    throw error;
  }
}

// Option B : Si tu as un bouton "Envoyer par email" (tracking déclenché par email)
document.getElementById('sendEmailButton').addEventListener('click', async () => {
  // 1. Récupérer le PDF base64 déjà généré
  const pdfBase64 = currentDocument.pdfBase64;
  
  // 2. Envoyer par email (logique existante)
  await sendEmailWithDocument(formData);
  
  // 3. Tracker après envoi par email (avec le fichier)
  await trackDocumentGeneration({
    userEmail: user.email,
    type: selectedDocumentType,
    title: `${documentTitle}.pdf`,
    template: templateUsed,
    wordCount: currentDocument.wordCount,
    file_base64: pdfBase64 // ⚠️ IMPORTANT: Le PDF en base64
  });
});

// Option C : Si tu utilises Firebase/Auth avec PDF
import { getAuth } from 'firebase/auth';

function getCurrentUserEmail() {
  const auth = getAuth();
  return auth.currentUser?.email || 'unknown@fo-metaux.fr';
}

// Exemple complet avec Firebase
async function onDocumentGenerated(documentData) {
  const auth = getAuth();
  const userEmail = auth.currentUser?.email;
  
  if (!userEmail) {
    console.warn('User not authenticated, skipping tracking');
    return;
  }
  
  await trackDocumentGeneration({
    userEmail,
    type: documentData.type,
    title: documentData.title,
    template: documentData.template,
    wordCount: documentData.content?.length || 0
  });
}

// ================================================
// 4. TYPES TYPESCRIPT (Optionnel)
// ================================================
interface DocumentTrackingData {
  userEmail: string;
  type: string;
  title: string;
  template?: string;
  wordCount?: number;
}

interface WebhookPayload {
  user_email: string;
  document_type: string;
  title: string;
  metadata: {
    template_used?: string;
    word_count?: number;
    generated_at: string;
    [key: string]: any;
  };
}

// ================================================
// 5. TESTS
// ================================================

// Test du webhook en console
async function testWebhook() {
  await trackDocumentGeneration({
    userEmail: 'contact@fo-metaux.fr',
    type: 'Test Document',
    title: 'Test Tracking Webhook',
    template: 'test-template',
    wordCount: 500
  });
}

// Appeler dans la console :
// testWebhook()

// ================================================
// 6. GESTION DES ERREURS
// ================================================

// Si tu veux être notifié des échecs
async function trackWithRetry(documentData, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(WEBHOOK_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': WEBHOOK_CONFIG.apiKey
        },
        body: JSON.stringify({
          user_email: documentData.userEmail,
          document_type: documentData.type,
          title: documentData.title,
          metadata: documentData.metadata || {}
        })
      });

      if (response.ok) {
        return await response.json();
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Final tracking attempt failed:', error);
      }
    }
  }
}

// ================================================
// NOTES IMPORTANTES
// ================================================
// 1. Remplace getCurrentUserEmail() par ta logique d'authentification
// 2. La clé API 'fo-metaux-docease-2025' doit être gardée secrète
// 3. Le tracking ne bloque jamais la génération du document
// 4. Les erreurs sont loggées mais n'affectent pas l'utilisateur
// 5. Teste d'abord avec testWebhook() avant de déployer

export { trackDocumentGeneration, trackWithRetry, testWebhook };
