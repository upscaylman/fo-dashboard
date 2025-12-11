import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ChevronRight, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  actions?: { label: string; action: () => void }[];
  timestamp: Date;
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Bonjour camarade ! Je suis Métallo, ton assistant intelligent. Pose-moi une question sur tes droits, la convention collective ou nos outils !",
      sender: 'bot',
      timestamp: new Date(),
      actions: [
        { label: "Générer un courrier", action: () => window.open('https://fo-docease.netlify.app/', '_blank') },
        { label: "Signer un PDF", action: () => window.open('https://signeasy.netlify.app/', '_blank') }
      ]
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

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

    try {
        // Initialisation de l'IA
        const apiKey = import.meta.env.VITE_API_KEY;

        if (!apiKey) {
            throw new Error("Clé API manquante");
        }

        const ai = new GoogleGenAI({ apiKey });

        // Contexte pour l'IA (System Instruction)
        const systemInstruction = `
            Tu es Métallo, l'assistant virtuel expert de la Fédération FO de la Métallurgie.
            Ton ton est professionnel, fraternel (tu utilises "camarade") et engagé.
            
            Tu as connaissance des outils internes suivants :
            1. DocEase (https://fo-docease.netlify.app/) : Pour générer des courriers juridiques et syndicaux automatiquement.
            2. SignEase (https://signeasy.netlify.app/) : Pour signer électroniquement des documents PDF.
            3. Site Fédéral (https://www.fo-metaux.fr/) : Pour les actualités et le calculateur de prime d'ancienneté.
            
            Si l'utilisateur pose une question juridique, réponds brièvement en citant la Convention Collective de la Métallurgie si pertinent.
            Si l'utilisateur veut rédiger ou signer, oriente-le vers les outils ci-dessus.
            Sois concis.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        const botResponseText = response.text || "Désolé, je n'ai pas réussi à formuler une réponse.";

        // Création du message du bot
        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: botResponseText,
            sender: 'bot',
            timestamp: new Date(),
            // On ajoute des actions contextuelles simples si détectées dans la réponse (logique simple)
            actions: botResponseText.includes('DocEase') ? [{ label: "Ouvrir DocEase", action: () => window.open('https://fo-docease.netlify.app/', '_blank') }] 
                   : botResponseText.includes('SignEase') ? [{ label: "Ouvrir SignEase", action: () => window.open('https://signeasy.netlify.app/', '_blank') }]
                   : undefined
        };

        setMessages(prev => [...prev, botMsg]);

    } catch (error) {
        console.error("Erreur Gemini:", error);
        
        const errorMessage = "Je rencontre un problème technique.";

        // Fallback en cas d'erreur
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: errorMessage + " Voici les liens utiles en attendant :",
            sender: 'bot',
            timestamp: new Date(),
            actions: [
                { label: "Ouvrir DocEase", action: () => window.open('https://fo-docease.netlify.app/', '_blank') },
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      
      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="pointer-events-auto bg-white dark:bg-slate-900 w-[350px] h-[500px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
          {/* Header */}
          <div className="p-4 bg-fo-red text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Métallo</h3>
                <p className="text-xs text-white/80">IA Fédérale • Gemini 2.5</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  msg.sender === 'user' 
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
        className="pointer-events-auto bg-fo-red hover:bg-red-700 text-white p-4 rounded-full shadow-lg shadow-red-600/30 transition-all hover:scale-110 active:scale-95 group relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        
        {/* Notification Badge (Fake) */}
        {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold">1</span>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;