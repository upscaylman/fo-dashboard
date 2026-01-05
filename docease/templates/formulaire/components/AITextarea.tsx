import React, { useState, useCallback } from 'react';
import { CONFIG, getAiWebhookUrl, fetchWithTimeout } from '../config';

interface AITextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  objetValue?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  showInfo?: (message: string, duration?: number) => void;
  showSuccess?: (message: string, duration?: number) => void;
  showError?: (message: string, duration?: number) => void;
}

export const AITextarea: React.FC<AITextareaProps> = ({
  label,
  value,
  onChange,
  objetValue = '',
  placeholder,
  required,
  rows = 5,
  maxLength,
  showInfo,
  showSuccess,
  showError
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Appliquer la limite de caractères si définie
    if (maxLength && newValue.length > maxLength) {
      return; // Ne pas mettre à jour si la limite est dépassée
    }
    onChange(newValue);
    setCharCount(newValue.length);
  }, [onChange, maxLength]);

  const handleImproveText = useCallback(async () => {
    const originalText = value.trim();
    if (!originalText || originalText.length < 10) {
      if (showError) {
        showError('Veuillez saisir au moins 10 caractères pour utiliser l\'IA');
      } else {
        alert('Veuillez saisir au moins 10 caractères pour utiliser l\'IA');
      }
      return;
    }

    setIsImproving(true);

    // Afficher un toast d'information sur la lenteur
    if (showInfo) {
      showInfo('⏳ Génération en cours... Cela peut prendre jusqu\'à 1 minute selon la charge du serveur. Merci de patienter.', 10000);
    }

    try {
      // Construire le prompt avec la limite de caractères configurée
      const charLimit = maxLength || 800;
      let promptText = `You are a professional assistant specialized in metallurgy unions. Write a complete and professional text for an administrative document. STRICT MAXIMUM: ${charLimit} characters. Do NOT exceed this limit.\n\n`;
      if (objetValue) {
        promptText += `Document subject: ${objetValue}\n\n`;
      }
      promptText += `Information to use: ${originalText}\n\n`;
      promptText += `Instructions:\n- Write a complete and structured text (no suggestions or lists)\n- Text must be directly related to the document subject\n- Use formal and professional style\n- Text must be ready to use as-is in the document\n- CRITICAL: Your response MUST be under ${charLimit} characters. Count carefully.\n- IMPORTANT: Always finish your sentences properly. If you run out of space, write less but end cleanly.\n- RESPOND IN FRENCH\n\nDocument text:`;

      console.log('🤖 Appel à l\'IA avec le prompt:', promptText.substring(0, 100) + '...');

      // Détecter si on est en production
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      let improvedText: string;

      if (isProduction) {
        // En production : utiliser le webhook n8n (URL dynamique pour éviter le cache)
        const aiUrl = getAiWebhookUrl();
        console.log('🌐 Mode PRODUCTION - Appel du webhook n8n');
        console.log('URL:', aiUrl);

        const response = await fetchWithTimeout(aiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            action: 'improve-text',
            prompt: promptText,
            originalText: originalText,
            objet: objetValue
          })
        }, CONFIG.AI_REQUEST_TIMEOUT);

        console.log('📡 Réponse HTTP:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Réponse vide');
          console.error('❌ Erreur HTTP:', errorText);
          
          // Détecter si c'est une page HTML ngrok (page d'avertissement)
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
            throw new Error('Le serveur IA n\'est pas disponible. Veuillez réessayer dans quelques instants.');
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Données reçues:', data);

        // Le webhook n8n peut retourner différents formats
        improvedText = data.improvedText || data.response || data.text || data.texteAmeliore || '';
      } else {
        // En développement local : appeler Ollama directement
        console.log('💻 Mode LOCAL - Appel direct à Ollama');

        const response = await fetchWithTimeout('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: CONFIG.OLLAMA_MODEL,
            prompt: promptText,
            stream: false,
            options: {
              num_predict: 1000,
              temperature: 0.7,
              top_p: 0.9,
              top_k: 40
            }
          })
        }, CONFIG.AI_REQUEST_TIMEOUT);

        console.log('📡 Réponse HTTP:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erreur HTTP:', errorText);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Données reçues:', data);

        improvedText = data.response?.trim() || '';
      }

      if (!improvedText || improvedText.length === 0) {
        throw new Error('Réponse vide de l\'IA. Le modèle n\'a pas généré de texte.');
      }

      // Tronquer le texte si nécessaire (l'IA peut parfois dépasser la limite)
      if (improvedText.length > charLimit) {
        console.warn(`⚠️ Texte tronqué de ${improvedText.length} à ${charLimit} caractères`);
        // Tronquer intelligemment à la fin d'une phrase si possible
        let truncated = improvedText.substring(0, charLimit);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        // Si on trouve une fin de phrase dans les 100 derniers caractères, couper là
        if (lastSentenceEnd > charLimit - 100) {
          truncated = improvedText.substring(0, lastSentenceEnd + 1);
        }
        improvedText = truncated;
      }

      // Mettre à jour le texte
      onChange(improvedText);
      setCharCount(improvedText.length);

      console.log('✅ Texte amélioré avec succès !');

      if (showSuccess) {
        showSuccess('✅ Texte amélioré avec succès !');
      } else {
        alert('✅ Texte amélioré avec succès !');
      }
    } catch (error) {
      console.error('❌ Erreur IA:', error);

      // Message d'erreur détaillé selon le type d'erreur
      let errorMessage = 'Erreur lors de l\'amélioration du texte';

      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'La requête a pris trop de temps (timeout). Le serveur IA est peut-être surchargé. Veuillez réessayer.';
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Impossible de se connecter au serveur IA. Vérifiez votre connexion internet.';
      } else if (error instanceof Error) {
        // Améliorer les messages d'erreur HTTP
        if (error.message.includes('500')) {
          errorMessage = 'Erreur serveur (500). Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants.';
        } else if (error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
          errorMessage = 'Le serveur IA est surchargé ou en maintenance. Veuillez réessayer plus tard.';
        } else {
          errorMessage = error.message;
        }
      }

      if (showError) {
        showError(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsImproving(false);
    }
  }, [value, objetValue, onChange, showInfo, showSuccess, showError]);

  const handleClear = useCallback(() => {
    onChange('');
    setCharCount(0);
  }, [onChange]);

  const minCharsReached = charCount >= 10;

  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">
        {label}
        {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
      </label>
      <div className="relative">
        <textarea
          className="w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 border-[#e7e0ec] dark:border-[rgb(75,85,99)] text-[#1c1b1f] dark:text-white text-base rounded-2xl px-4 py-3 pr-24 outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10 resize-y"
          placeholder={placeholder}
          required={required}
          rows={rows}
          value={value}
          onChange={handleChange}
          minLength={10}
          maxLength={maxLength}
          title="Minimum 10 caractères requis pour déclencher l'IA"
        />
        {/* Boutons */}
        {value && (
          <div className="absolute right-3 top-3 flex gap-1">
            {/* Bouton Améliorer avec IA */}
            <button
              type="button"
              onClick={handleImproveText}
              disabled={isImproving || !minCharsReached}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={minCharsReached ? "Améliorer avec l'IA" : "Minimum 10 caractères requis"}
            >
              {isImproving ? (
                <span className="material-icons text-base animate-spin">autorenew</span>
              ) : (
                <span className="material-icons text-base">auto_fix_high</span>
              )}
            </button>
            {/* Bouton Effacer */}
            <button
              type="button"
              onClick={handleClear}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Effacer"
            >
              <span className="material-icons text-base">close</span>
            </button>
          </div>
        )}
      </div>
      {/* Compteur de caractères */}
      <div className="text-xs mt-1 ml-1 flex items-center justify-between">
        <div>
          <span className={`font-bold ${minCharsReached ? 'text-green-600' : 'text-red-600'}`}>
            {charCount}
          </span>
          <span className="text-gray-500"> / 10 caractères minimum (pour déclencher l'IA)</span>
        </div>
        {maxLength && (
          <div>
            <span className={`font-bold ${charCount > maxLength ? 'text-red-600' : charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-600'}`}>
              {charCount}
            </span>
            <span className="text-gray-500"> / {maxLength} max</span>
          </div>
        )}
      </div>
    </div>
  );
};

