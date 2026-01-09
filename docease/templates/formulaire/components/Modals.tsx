import React, { useState } from 'react';
import { Button } from './Button';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, subtitle, icon, children, actions, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-[#fdfbff] w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-[28px] shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {icon && <span className="material-icons text-4xl text-[#a84383]">{icon}</span>}
            <div>
              <h2 className="text-2xl font-bold text-[#1c1b1f]">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
            <span className="material-icons text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="p-6 border-t border-gray-100 bg-[#f8f9fa] flex justify-end gap-3 rounded-b-[28px]">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  isLoading: boolean;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  onShare: () => void;
  filename?: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  pdfBlob,
  isLoading,
  onDownloadWord,
  onDownloadPdf,
  onShare,
  filename
}) => {
  const pdfUrl = pdfBlob ? URL.createObjectURL(pdfBlob) : null;
  
  // Détecter si on est sur mobile (iOS Safari et certains Android ne supportent pas l'iframe PDF)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Ouvrir le PDF dans un nouvel onglet (fallback pour mobile)
  const openPdfInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Prévisualisation PDF"
      subtitle={filename ? `📄 ${filename.replace('.docx', '.pdf')}` : 'Vérifiez le document avant de télécharger ou partager'}
      icon="visibility"
      maxWidth="max-w-6xl"
      actions={
        <>
          <Button variant="secondary" icon="download" label="Word" onClick={onDownloadWord} disabled={isLoading} />
          <Button className="bg-[#e04142] hover:bg-[#c0392b] text-white shadow-md" icon="picture_as_pdf" label="PDF" onClick={onDownloadPdf} disabled={isLoading} />
          <Button variant="outlined" icon="share" label="Partager" onClick={onShare} disabled={isLoading} />
        </>
      }
    >
      <div className="bg-white shadow-sm border border-gray-100 min-h-[600px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#a84383] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Génération du PDF en cours...</p>
          </div>
        ) : pdfUrl ? (
          isMobile ? (
            // Fallback pour mobile : bouton pour ouvrir dans un nouvel onglet
            <div className="flex flex-col items-center gap-6 p-8 text-center">
              <div className="w-24 h-24 bg-[#ffd8ec] rounded-full flex items-center justify-center">
                <span className="material-icons text-5xl text-[#a84383]">picture_as_pdf</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1c1b1f] mb-2">Document prêt !</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  La prévisualisation intégrée n'est pas disponible sur mobile. 
                  Cliquez sur le bouton ci-dessous pour voir le PDF.
                </p>
              </div>
              <button
                onClick={openPdfInNewTab}
                className="flex items-center gap-2 px-6 py-3 bg-[#a84383] text-white rounded-full font-semibold shadow-lg hover:bg-[#8a366b] transition-colors"
              >
                <span className="material-icons">open_in_new</span>
                Ouvrir le PDF
              </button>
              <p className="text-xs text-gray-400">
                Ou utilisez les boutons ci-dessous pour télécharger directement
              </p>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] border-0"
              title="Prévisualisation PDF"
            />
          )
        ) : (
          <div className="text-center text-gray-400">
            <span className="material-icons text-6xl mb-4">description</span>
            <p>Aucun document à prévisualiser</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emails: string[], customMessage: string) => void;
  isSending: boolean;
  defaultEmail?: string;
  selectedTemplate?: string;
  typeConvocation?: string;
  dateDebut?: string;
  heureDebut?: string;
  numeroCourrier?: string;
  onDownload?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onSend, isSending, defaultEmail, selectedTemplate, typeConvocation, dateDebut, heureDebut, numeroCourrier, onDownload }) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Génère le message par défaut selon le template
  const getDefaultMessage = () => {
    if (selectedTemplate === 'convocations') {
      if (typeConvocation === 'CA Fédérale') {
        return `Madame, Monsieur,

Vous êtes convié(e) à participer à la réunion de la Commission Administrative Fédérale qui se tiendra le ${dateDebut || '[date]'} à ${heureDebut || '[heure]'}.

Veuillez trouver ci-joint la convocation officielle avec l'ordre du jour.

Votre présence est vivement souhaitée.

Cordialement,
FO METAUX`;
      } else if (typeConvocation === 'Bureau Fédéral') {
        return `Madame, Monsieur,

Vous êtes convié(e) à participer à la réunion du Bureau Fédéral qui se tiendra le ${dateDebut || '[date]'} à ${heureDebut || '[heure]'}.

Veuillez trouver ci-joint la convocation officielle avec l'ordre du jour.

Votre présence est vivement souhaitée.

Cordialement,
FO METAUX`;
      }
    }
    
    if (selectedTemplate === 'circulaire') {
      return `Madame, Monsieur,

Veuillez trouver ci-joint la Circulaire ${numeroCourrier ? `n°${numeroCourrier}` : ''} de la Fédération FO Métaux.

Nous vous remercions de bien vouloir en prendre connaissance et de la diffuser auprès de vos équipes.

Restant à votre disposition pour tout renseignement complémentaire.

Cordialement,
FO METAUX`;
    }
    
    // Message par défaut pour les autres templates
    return `Bonjour Madame, Monsieur,

Veuillez trouver ci-joint le courrier de notre Fédération FO,
Fait pour valoir ce que de droit,

Bonne réception,

Cordialement,
FO METAUX`;
  };

  const defaultMessage = getDefaultMessage();

  const [message, setMessage] = useState(defaultMessage);
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Initialiser avec l'email par défaut et le message quand la modal s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      // Réinitialiser le message prédéfini selon le template
      setMessage(getDefaultMessage());
      // Réinitialiser la liste d'emails à chaque ouverture
      if (defaultEmail) {
        // Si defaultEmail contient plusieurs emails séparés par des virgules (cas de la circulaire)
        const emailList = defaultEmail.split(',').map(e => e.trim()).filter(e => e && e.includes('@'));
        setEmails(emailList);
      } else {
        setEmails([]);
      }
      setInputValue('');
    }
  }, [isOpen, selectedTemplate, typeConvocation, dateDebut, heureDebut, numeroCourrier]); // Recalculer le message si le template change

  const removeEmail = (index: number) => {
    setEmails(prev => prev.filter((_, i) => i !== index));
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && trimmedEmail.includes('@') && !emails.includes(trimmedEmail)) {
      setEmails(prev => [...prev, trimmedEmail]);
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (addEmail(inputValue)) {
        setInputValue('');
      }
    }
  };

  const handleSend = () => {
    // Ajouter l'email en cours de saisie s'il y en a un
    if (inputValue.trim()) {
      const added = addEmail(inputValue);
      if (added) {
        setInputValue('');
      }
    }

    // Vérifier après avoir ajouté l'email en cours
    if (emails.length === 0 && !inputValue.trim()) {
      alert('Veuillez entrer au moins une adresse email');
      return;
    }

    // Si on a ajouté un email juste avant, utiliser la liste mise à jour
    const finalEmails = inputValue.trim() && inputValue.includes('@')
      ? [...emails, inputValue.trim()]
      : emails;

    if (finalEmails.length === 0) {
      alert('Veuillez entrer au moins une adresse email valide');
      return;
    }

    onSend(finalEmails, message);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Partager le document"
      subtitle="Envoyer le document par email"
      icon="share"
      actions={
        <Button
          variant="outlined"
          icon="send"
          label={isSending ? "Envoi en cours..." : "Envoyer"}
          onClick={handleSend}
          disabled={isSending}
        />
      }
    >
      <div className="space-y-6">
        {/* Bouton de téléchargement sur mobile */}
        {isMobile && onDownload && (
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              icon="download"
              label="Télécharger le PDF"
              onClick={() => { onClose(); onDownload(); }}
              className="w-full justify-center"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Destinataires</label>
          <div
            className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus-within:border-[#a84383] transition-colors flex flex-wrap gap-2 cursor-text min-h-[52px]"
            onClick={() => document.getElementById('email-input')?.focus()}
          >

            {/* Chips dynamiques */}
            {emails.map((email, index) => (
              <span key={index} className="bg-[#ffd8ec] text-[#a84383] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 animate-[fadeIn_0.2s]">
                {email}
                <button
                  type="button"
                  className="material-icons text-sm cursor-pointer hover:text-[#8f366e] rounded-full hover:bg-[#a84383]/10 p-0.5 transition-colors flex items-center justify-center w-4 h-4"
                  onClick={(e) => { e.stopPropagation(); removeEmail(index); }}
                >
                  close
                </button>
              </span>
            ))}

            <input
              id="email-input"
              type="text"
              className="flex-1 outline-none min-w-[150px] bg-transparent text-[#1c1b1f]"
              placeholder="Ajouter un email..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Séparez les emails par des virgules, espaces ou Entrée.</p>
        </div>
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Message personnalisé (optionnel)</label>
           <div className="relative">
             <textarea
               className="w-full bg-[#fdfbff] border-2 border-gray-200 rounded-xl p-4 pr-10 outline-none focus:border-[#a84383] min-h-[120px] text-black"
               placeholder="Ajoutez un message personnalisé qui accompagnera le document..."
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               disabled={isSending}
             ></textarea>
             {message && (
               <button
                 type="button"
                 onClick={() => setMessage('')}
                 className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors"
                 title="Effacer le message"
               >
                 <span className="material-icons text-gray-500" style={{ fontSize: '18px' }}>close</span>
               </button>
             )}
           </div>
        </div>
        {isSending && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700 text-sm">Envoi du document en cours...</span>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
