import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, ChevronRight, Loader2, User, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DOCEASE_URL, SIGNEASE_URL } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../lib/permissions';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  actions?: { label: string; action: () => void }[];
  timestamp: Date;
}

// Contexte de l'application pour l'IA
interface AppContext {
  currentPage: string;
  currentTime: string;
  dayOfWeek: string;
  holiday?: { name: string; emoji: string; message: string };
}

// Détection des fêtes françaises importantes
const getFrenchHoliday = (date: Date): { name: string; emoji: string; message: string } | null => {
  const day = date.getDate();
  const month = date.getMonth() + 1; // 0-indexed
  const year = date.getFullYear();
  
  // Fêtes fixes
  const fixedHolidays: Record<string, { name: string; emoji: string; message: string }> = {
    '1-1': { name: 'Jour de l\'An', emoji: '🎉', message: 'Bonne année ! Que cette nouvelle année vous apporte succès et réussite.' },
    '6-1': { name: 'Épiphanie', emoji: '👑', message: 'Joyeuse Épiphanie ! Avez-vous tiré les rois ?' },
    '14-2': { name: 'Saint-Valentin', emoji: '❤️', message: 'Joyeuse Saint-Valentin !' },
    '1-5': { name: 'Fête du Travail', emoji: '💪', message: 'Bonne fête du Travail ! Une journée pour célébrer les droits des travailleurs.' },
    '8-5': { name: 'Victoire 1945', emoji: '🕊️', message: 'En ce jour de commémoration, n\'oublions pas.' },
    '21-6': { name: 'Fête de la Musique', emoji: '🎵', message: 'Bonne fête de la musique !' },
    '14-7': { name: 'Fête Nationale', emoji: '🇫🇷', message: 'Bonne fête nationale ! Vive la République !' },
    '15-8': { name: 'Assomption', emoji: '✨', message: 'Bonne fête de l\'Assomption.' },
    '1-11': { name: 'Toussaint', emoji: '🕯️', message: 'En ce jour de Toussaint, une pensée pour ceux qui nous ont quittés.' },
    '11-11': { name: 'Armistice 1918', emoji: '🎖️', message: 'Jour du souvenir. Honneur à ceux qui ont combattu.' },
    '25-12': { name: 'Noël', emoji: '🎄', message: 'Joyeux Noël ! Passez de belles fêtes.' },
    '31-12': { name: 'Saint-Sylvestre', emoji: '🥂', message: 'Bonne Saint-Sylvestre ! Profitez bien de cette dernière journée de l\'année.' },
  };
  
  // Vérifier les fêtes autour de la date (veille, jour J, lendemain pour certaines)
  const key = `${day}-${month}`;
  if (fixedHolidays[key]) {
    return fixedHolidays[key];
  }
  
  // Pâques (calcul algorithmique) et fêtes mobiles associées
  const getEasterDate = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, easterMonth - 1, easterDay);
  };
  
  const easter = getEasterDate(year);
  const dateStr = `${day}-${month}`;
  
  // Lundi de Pâques (lendemain de Pâques)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  if (day === easterMonday.getDate() && month === easterMonday.getMonth() + 1) {
    return { name: 'Lundi de Pâques', emoji: '🐰', message: 'Joyeux lundi de Pâques !' };
  }
  
  // Dimanche de Pâques
  if (day === easter.getDate() && month === easter.getMonth() + 1) {
    return { name: 'Pâques', emoji: '🐣', message: 'Joyeuses Pâques !' };
  }
  
  // Ascension (39 jours après Pâques)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  if (day === ascension.getDate() && month === ascension.getMonth() + 1) {
    return { name: 'Ascension', emoji: '☁️', message: 'Bonne fête de l\'Ascension.' };
  }
  
  // Pentecôte (49 jours après Pâques)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  if (day === pentecost.getDate() && month === pentecost.getMonth() + 1) {
    return { name: 'Pentecôte', emoji: '🕊️', message: 'Bonne Pentecôte !' };
  }
  
  // Lundi de Pentecôte (50 jours après Pâques)
  const pentecostMonday = new Date(easter);
  pentecostMonday.setDate(easter.getDate() + 50);
  if (day === pentecostMonday.getDate() && month === pentecostMonday.getMonth() + 1) {
    return { name: 'Lundi de Pentecôte', emoji: '🌿', message: 'Bon lundi de Pentecôte !' };
  }
  
  // Fête des mères (dernier dimanche de mai ou premier de juin)
  if (month === 5 || month === 6) {
    // Approximation: vérifier si c'est le dernier dimanche de mai
    const lastSundayMay = new Date(year, 4, 31);
    while (lastSundayMay.getDay() !== 0) lastSundayMay.setDate(lastSundayMay.getDate() - 1);
    if (day === lastSundayMay.getDate() && month === 5) {
      return { name: 'Fête des Mères', emoji: '💐', message: 'Bonne fête à toutes les mamans !' };
    }
  }
  
  // Fête des pères (3ème dimanche de juin)
  if (month === 6) {
    let thirdSunday = new Date(year, 5, 1);
    let count = 0;
    while (count < 3) {
      if (thirdSunday.getDay() === 0) count++;
      if (count < 3) thirdSunday.setDate(thirdSunday.getDate() + 1);
    }
    if (day === thirdSunday.getDate()) {
      return { name: 'Fête des Pères', emoji: '👔', message: 'Bonne fête à tous les papas !' };
    }
  }
  
  return null;
};

const ChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Message d'accueil personnalisé selon l'utilisateur et les fêtes
  const getWelcomeMessage = useMemo(() => {
    const userName = user?.name?.split(' ')[0] || '';
    const userRole = user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role : '';
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';
    const holiday = getFrenchHoliday(now);
    
    let welcomeText = userName 
      ? `${greeting} ${userName} ! 👋 Je suis Métallo, votre assistant intelligent.`
      : `${greeting} ! 👋 Je suis Métallo, votre assistant intelligent.`;
    
    // Ajouter le message de fête si applicable
    if (holiday) {
      welcomeText += ` ${holiday.emoji} ${holiday.message}`;
    }
    
    if (userRole) {
      welcomeText += ` En tant que ${userRole}, je suis là pour vous aider.`;
    }
    
    welcomeText += ` Comment puis-je vous aider ?`;
    
    return welcomeText;
  }, [user]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Initialiser le message de bienvenue quand l'utilisateur change
  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: getWelcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
        actions: [
          { label: "Générer un courrier", action: () => window.open(DOCEASE_URL, '_blank') },
          { label: "Signer un PDF", action: () => window.open(SIGNEASE_URL, '_blank') }
        ]
      }
    ]);
  }, [getWelcomeMessage]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Obtenir le contexte actuel de l'application
  const getAppContext = (): AppContext => {
    const now = new Date();
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const holiday = getFrenchHoliday(now);
    return {
      currentPage: 'Dashboard FO Métaux',
      currentTime: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: days[now.getDay()],
      holiday: holiday || undefined
    };
  };
  
  // Construire l'historique de conversation pour le contexte
  const buildConversationHistory = () => {
    // Prendre les 10 derniers messages pour le contexte
    return messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  // Marquer comme lu quand le chat est ouvert
  useEffect(() => {
    if (isOpen) {
      setHasUnreadMessage(false);
    }
  }, [isOpen]);

  // Déclencher l'animation quand un nouveau message bot arrive
  useEffect(() => {
    if (!isOpen && messages.length > 1 && messages[messages.length - 1].sender === 'bot') {
      setHasUnreadMessage(true);
      setShouldAnimate(true);
      
      // Arrêter l'animation après 1 seconde
      const timer = setTimeout(() => setShouldAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // 1. Ajouter le message de l'utilisateur
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Récupérer le contexte applicatif
    const appContext = getAppContext();
    const conversationHistory = buildConversationHistory();
    
    // Informations sur l'utilisateur actuel
    const userInfo = user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role
    } : null;

    // Contexte enrichi pour l'IA (System Instruction)
    const systemInstruction = `
Tu es Métallo, l'assistant virtuel intelligent de la Fédération FO de la Métallurgie.
Tu es moderne, efficace et tu comprends le contexte des conversations.

=== INFORMATIONS SUR L'UTILISATEUR ACTUEL ===
${userInfo ? `
- Prénom/Nom : ${userInfo.name}
- Email : ${userInfo.email}
- Rôle : ${userInfo.roleLabel} (${userInfo.role})
- Tu peux l'appeler par son prénom, de manière professionnelle et cordiale.
` : '- Utilisateur non connecté'}

=== CONTEXTE DE L'APPLICATION ===
- Page actuelle : ${appContext.currentPage}
- Jour : ${appContext.dayOfWeek}
- Heure : ${appContext.currentTime}
${appContext.holiday ? `- 🎉 FÊTE DU JOUR : ${appContext.holiday.name} ${appContext.holiday.emoji}
  Tu peux mentionner cette fête de manière naturelle si approprié dans la conversation.` : ''}

=== HIÉRARCHIE DES RÔLES (du plus élevé au plus bas) ===
1. Super Administrateur (super_admin) : Accès complet à tout, gestion des utilisateurs, statistiques globales
2. Secrétaire Général (secretary_general) : Gestion des documents, accès aux statistiques fédérales
3. Secrétaire (secretary) : Mêmes droits que Secrétaire Général
4. Secrétaire Fédéral (secretary_federal) : Accès limité à ses propres documents et statistiques

=== OUTILS INTERNES FO METAUX ===
1. **DocEase** (${DOCEASE_URL}) : Génération automatique de courriers professionnels (convocation, mise en demeure, réclamation, etc.)
2. **SignEase** (${SIGNEASE_URL}) : Signature électronique de documents PDF
3. **Site Fédéral** (https://www.fo-metaux.fr/) : Actualités, calculateur de prime d'ancienneté
4. **Convention Collective de la Métallurgie** : Pour les questions juridiques

=== TON COMPORTEMENT ===
- Ton : Professionnel, moderne et cordial. JAMAIS de "camarade", "fraternel" ou vocabulaire syndicaliste désuet.
- Utilise le vouvoiement par défaut, sauf si l'utilisateur te tutoie.
- Tu te souviens du contexte de la conversation (questions précédentes, sujets abordés)
- Si on te demande "de quoi on parlait" ou "tu te souviens", tu résumes les échanges précédents
- Si l'utilisateur dit "il", "elle", "ça", "ce document", etc., déduis de quoi il parle grâce au contexte
- Personnalise tes réponses selon le rôle de l'utilisateur (ex: un super_admin peut tout faire, un secretary_federal a des droits limités)
- Sois concis, efficace et utile
- Si on te pose une question juridique, cite la Convention Collective de la Métallurgie si pertinent
- Propose proactivement les outils adaptés (DocEase pour les courriers, SignEase pour les signatures)

=== HISTORIQUE DE LA CONVERSATION ===
${conversationHistory.length > 1 ? `
Voici les ${conversationHistory.length - 1} derniers échanges pour contexte :
${conversationHistory.slice(0, -1).map((msg, i) => `${msg.role === 'user' ? '👤 Utilisateur' : '🤖 Métallo'}: ${msg.content}`).join('\n')}
` : 'C\'est le début de la conversation.'}

Réponds maintenant au message de l'utilisateur en tenant compte de tout ce contexte.
    `.trim();

    let botResponseText = "";

    // Essayer Gemini d'abord
    try {
      const geminiApiKey = import.meta.env.VITE_API_KEY;

      if (!geminiApiKey) {
        throw new Error("Clé API Gemini manquante");
      }

      // @ts-ignore
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // @ts-ignore
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: text,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      // @ts-ignore
      botResponseText = response.text || "";
      
      if (!botResponseText) throw new Error("Réponse Gemini vide");
      
      console.log("✅ Réponse via Gemini");

    } catch (geminiError: any) {
      console.warn("⚠️ Gemini échoué, tentative Groq...", geminiError.message);

      // Fallback vers Groq (gratuit, rapide)
      try {
        const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
        
        if (!groqApiKey) {
          throw new Error("Clé API Groq manquante");
        }

        // Construire les messages avec l'historique complet pour Groq
        const groqMessages = [
          { role: "system", content: systemInstruction },
          // Ajouter l'historique de conversation (sans le dernier message système)
          ...conversationHistory.slice(0, -1).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          // Ajouter le nouveau message de l'utilisateur
          { role: "user", content: text }
        ];

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: groqMessages,
            max_tokens: 800,
            temperature: 0.7
          })
        });

        if (!groqResponse.ok) {
          throw new Error(`Groq API error: ${groqResponse.status}`);
        }

        const groqData = await groqResponse.json();
        botResponseText = groqData.choices?.[0]?.message?.content || "";
        
        if (!botResponseText) throw new Error("Réponse Groq vide");
        
        console.log("✅ Réponse via Groq (fallback)");

      } catch (groqError: any) {
        console.error("❌ Groq aussi échoué:", groqError.message);
        throw new Error("Les deux IAs sont indisponibles");
      }
    }

    // Création du message du bot avec actions contextuelles
    try {
      // Détection des actions à proposer selon le contenu de la réponse
      const detectActions = (responseText: string): { label: string; action: () => void }[] | undefined => {
        const actions: { label: string; action: () => void }[] = [];
        const lowerText = responseText.toLowerCase();
        
        if (lowerText.includes('docease') || lowerText.includes('courrier') || lowerText.includes('document') || lowerText.includes('lettre') || lowerText.includes('convocation')) {
          actions.push({ label: "📝 Ouvrir DocEase", action: () => window.open(DOCEASE_URL, '_blank') });
        }
        if (lowerText.includes('signease') || lowerText.includes('signer') || lowerText.includes('signature') || lowerText.includes('pdf')) {
          actions.push({ label: "✍️ Ouvrir SignEase", action: () => window.open(SIGNEASE_URL, '_blank') });
        }
        if (lowerText.includes('convention collective') || lowerText.includes('métallurgie')) {
          actions.push({ label: "📖 Convention Collective", action: () => window.open('https://conventioncollectivemetallurgie.fr/', '_blank') });
        }
        if (lowerText.includes('prime') || lowerText.includes('ancienneté') || lowerText.includes('calculateur')) {
          actions.push({ label: "🧮 Calculateur Prime", action: () => window.open('https://www.fo-metaux.fr/calculateur-de-prime-danciennet', '_blank') });
        }
        if (lowerText.includes('actualité') || lowerText.includes('fo-metaux') || lowerText.includes('fédéral')) {
          actions.push({ label: "📰 Site FO Métaux", action: () => window.open('https://www.fo-metaux.fr/', '_blank') });
        }
        
        return actions.length > 0 ? actions.slice(0, 3) : undefined; // Maximum 3 actions
      };
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date(),
        actions: detectActions(botResponseText)
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      console.error("Erreur IA:", error);

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "⚠️ Je rencontre un problème technique. Voici les liens utiles en attendant :",
        sender: 'bot',
        timestamp: new Date(),
        actions: [
          { label: "Ouvrir DocEase", action: () => window.open(DOCEASE_URL, '_blank') },
          { label: "Contacter le support", action: () => window.location.href = 'mailto:contact@fo-metaux.fr' }
        ]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTyping) handleSendMessage();
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-4 pointer-events-none max-w-[calc(100vw-2rem)]">

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="pointer-events-auto bg-white dark:bg-slate-900 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] h-[70vh] sm:h-[520px] max-h-[520px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-fo-red to-red-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-full relative">
                <Bot className="w-5 h-5" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  Métallo
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-normal">IA+</span>
                </h3>
                {user ? (
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {user.name?.split(' ')[0] || 'Utilisateur'}
                  </p>
                ) : (
                  <p className="text-xs text-white/80">Assistant intelligent</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Actions Rapides du Bot */}
                  {msg.actions && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={act.action}
                          className="flex items-center justify-between w-full p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors"
                        >
                          {act.label}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="text-[10px] opacity-50 block mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Métallo réfléchit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
              placeholder="Pose une question à Métallo..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bouton Flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto bg-fo-red hover:bg-red-700 text-white p-4 rounded-full shadow-lg shadow-red-600/30 transition-all hover:scale-110 active:scale-95 group relative ${
          shouldAnimate ? 'animate-bounce' : ''
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}

        {/* Notification Badge - disparaît quand le chat est ouvert */}
        {!isOpen && hasUnreadMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold animate-pulse">1</span>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;