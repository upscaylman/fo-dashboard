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
 */
async function trackDocumentGeneration(documentData) {
  try {
    const response = await fetch(WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': WEBHOOK_CONFIG.apiKey
      },
      body: JSON.stringify({
        user_email: documentData.userEmail, // Email de l'utilisateur connecté
        document_type: documentData.type,   // Ex: "Lettre de réclamation"
        title: documentData.title,          // Titre du document
        metadata: {
          template_used: documentData.template,
          word_count: documentData.wordCount,
          generated_at: new Date().toISOString(),
          // Ajouter d'autres métadonnées si besoin
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Document tracked:', result);
    } else {
      console.warn('⚠️ Tracking failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Tracking error:', error);
    // Ne pas bloquer la génération si le tracking échoue
  }
}

// ================================================
// 3. EXEMPLE D'INTÉGRATION
// ================================================

// Option A : Si tu utilises une fonction de génération principale
async function generateDocument(formData) {
  try {
    // 1. Générer le document (logique existante)
    const document = await yourExistingGenerationLogic(formData);
    
    // 2. Tracker la génération
    await trackDocumentGeneration({
      userEmail: getCurrentUserEmail(), // Fonction qui retourne l'email de l'utilisateur
      type: formData.documentType,
      title: formData.documentTitle || `Document ${formData.documentType}`,
      template: formData.templateId,
      wordCount: document.wordCount || 0
    });
    
    // 3. Télécharger/Afficher le document
    return document;
    
  } catch (error) {
    console.error('Document generation error:', error);
    throw error;
  }
}

// Option B : Si tu as un bouton "Télécharger"
document.getElementById('downloadButton').addEventListener('click', async () => {
  // Générer et télécharger
  const doc = await generateDocument(formData);
  downloadFile(doc);
  
  // Tracker après succès
  await trackDocumentGeneration({
    userEmail: user.email,
    type: selectedDocumentType,
    title: documentTitle,
    template: templateUsed,
    wordCount: doc.wordCount
  });
});

// Option C : Si tu utilises Firebase/Auth
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
