
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { TEMPLATES, STEPS, FORM_FIELDS, TEMPLATE_SPECIFIC_FIELDS, COMMON_FIELDS } from './constants';
import { StepType, FormData, FormField, TemplateId } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { FormStep } from './components/FormStep';
import { Button } from './components/Button';
import { UpdateNotification } from './components/UpdateNotification';
import { LoginPage } from './components/LoginPage';
import { InstallPWAButton } from './components/InstallPWAButton';
import { SplashScreen } from './components/SplashScreen';
import { generateWordDocument, convertWordToPdf, downloadBlob, base64ToBlob, sendEmailWithPdf, trackDocumentGeneration } from './api';
import { Toast, useToast } from './components/Toast';
import { LoadingOverlay, AppSkeleton } from './components/Spinner';
import { PullToRefresh } from './components/PullToRefresh';
import { useDoceaseAuth } from './context/AuthContext';
import { useDoceasePresence } from './hooks/useDoceasePresence';

// Lazy load des modals (chargés uniquement quand nécessaire)
const PreviewModal = lazy(() => import('./components/Modals').then(module => ({ default: module.PreviewModal })));
const ShareModal = lazy(() => import('./components/Modals').then(module => ({ default: module.ShareModal })));

const App: React.FC = () => {
  // Authentification
  const { isAuthenticated, isLoading: authLoading, user } = useDoceaseAuth();
  
  // Splash screen au premier chargement
  const [showSplash, setShowSplash] = useState(() => {
    // Afficher le splash uniquement si c'est un nouveau chargement (pas de session storage)
    const hasShownSplash = sessionStorage.getItem('docease-splash-shown');
    return !hasShownSplash;
  });
  
  // Tracking de présence
  const { trackActivity, updatePresence } = useDoceasePresence({ 
    currentPage: 'formulaire',
    tool: 'docease'
  });

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>('designation');
  const [formData, setFormData] = useState<FormData>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [generatedWord, setGeneratedWord] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Persistance des données par template (en mémoire uniquement, perdu à l'actualisation)
  const [templateDataStore, setTemplateDataStore] = useState<Record<string, FormData>>({});

  // Persistance des données par type de convocation (CA Fédérale / Bureau Fédéral)
  const [convocationDataStore, setConvocationDataStore] = useState<Record<string, FormData>>({});

  // Ordre personnalisé des champs par étape (pour le mode personnalisation)
  const [customFieldsOrder, setCustomFieldsOrder] = useState<Record<string, FormField[]>>({});

  // Modals state
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Customization mode (pour le template custom)
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Cache des documents générés par template (évite de régénérer si les données n'ont pas changé)
  const [documentCache, setDocumentCache] = useState<Record<string, { word: string; pdf: Blob; dataHash: string }>>({});

  // État pour le swipe mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Toast hook
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

  // Optimisation: mémoriser les valeurs calculées
  // Filtrer les steps selon le template (circulaire n'a pas de page signataire, convocations n'a que contenu et signataire)
  const availableSteps = useMemo(() => {
    if (selectedTemplate === 'circulaire') {
      // Pour circulaire : contenu en premier, puis coordonnées (renommé en Destinataire(s))
      const circulaireSteps = STEPS.filter(step => step.id !== 'expediteur' && step.id !== 'jour1' && step.id !== 'jour2' && step.id !== 'ordreDuJourBureau')
        .map(step => step.id === 'coordonnees' ? { ...step, label: 'Destinataire(s)', icon: 'group', description: 'Sélectionnez les destinataires' } : step);
      // Inverser l'ordre : contenu avant coordonnées
      return circulaireSteps.sort((a, b) => {
        if (a.id === 'contenu') return -1;
        if (b.id === 'contenu') return 1;
        return 0;
      });
    }
    if (selectedTemplate === 'convocations') {
      // Pour les convocations : pas de coordonnées, juste contenu et signataire (renommé Destinataire(s))
      const renameExpStep = (step: typeof STEPS[0]) => 
        step.id === 'expediteur' ? { ...step, label: 'Destinataire(s)', icon: 'group', description: 'Email des destinataires' } : step;
      
      // Renommer l'étape contenu si le type de convocation n'est pas encore sélectionné
      const renameContentStep = (step: typeof STEPS[0]) => {
        if (step.id === 'contenu' && !formData.typeConvocation) {
          return { ...step, label: 'Type de convocation', icon: 'event', description: 'Sélectionnez le type de convocation' };
        }
        return step;
      };
      
      // Si CA Fédérale est sélectionné, ajouter les onglets jour1 et jour2
      if (formData.typeConvocation === 'CA Fédérale') {
        return STEPS.filter(step => step.id !== 'coordonnees' && step.id !== 'ordreDuJourBureau').map(renameExpStep);
      }
      // Pour Bureau Fédéral, afficher l'onglet ordreDuJourBureau
      if (formData.typeConvocation === 'Bureau Fédéral') {
        return STEPS.filter(step => step.id !== 'coordonnees' && step.id !== 'jour1' && step.id !== 'jour2').map(renameExpStep);
      }
      // Pas encore sélectionné, pas d'onglets jour
      return STEPS.filter(step => step.id !== 'coordonnees' && step.id !== 'jour1' && step.id !== 'jour2' && step.id !== 'ordreDuJourBureau')
        .map(renameExpStep)
        .map(renameContentStep);
    }
    if (selectedTemplate === 'designation' || selectedTemplate === 'negociation' || selectedTemplate === 'custom') {
      // Pour designation, negociation et custom : coordonnées, contenu (avec codeDocument + signatureExp), destinataire(s)
      return STEPS.filter(step => step.id !== 'jour1' && step.id !== 'jour2' && step.id !== 'ordreDuJourBureau')
        .map(step => step.id === 'expediteur' ? { ...step, label: 'Destinataire(s)', icon: 'group', description: 'Email du destinataire' } : step);
    }
    // Pour les autres templates, pas d'onglets jour
    return STEPS.filter(step => step.id !== 'jour1' && step.id !== 'jour2' && step.id !== 'ordreDuJourBureau');
  }, [selectedTemplate, formData.typeConvocation]);

  // Protection : si l'index dépasse le tableau, revenir au premier step
  const safeStepIdx = useMemo(() => {
    if (currentStepIdx >= availableSteps.length) return 0;
    return currentStepIdx;
  }, [currentStepIdx, availableSteps.length]);

  const currentStep = useMemo(() => availableSteps[safeStepIdx] || availableSteps[0], [availableSteps, safeStepIdx]);
  const isFirstStep = useMemo(() => safeStepIdx === 0, [safeStepIdx]);
  const isLastStep = useMemo(() => safeStepIdx === availableSteps.length - 1, [safeStepIdx, availableSteps.length]);

  // Vérifier si le formulaire a des données
  const hasData = useMemo(() => Object.keys(formData).length > 0 && selectedTemplate !== null, [formData, selectedTemplate]);

  // Vérifier si le formulaire a des données non vides
  const hasNonEmptyData = useMemo(() => {
    return Object.values(formData).some(value => value && value.trim() !== '');
  }, [formData]);

  // Fonction pour obtenir les champs selon le template et l'étape
  const getFieldsForStep = useCallback((stepId: StepType): FormField[] => {
    // Clé unique par template + étape pour isoler les personnalisations
    const customKey = `${selectedTemplate}_${stepId}`;
    if (customFieldsOrder[customKey]) {
      return customFieldsOrder[customKey];
    }

    if (stepId === 'coordonnees') {
      if (selectedTemplate === 'circulaire') {
        // Pour la circulaire, seulement emailDestinataire (non obligatoire, pleine largeur) - numeroCourrier est dans contenu
        return COMMON_FIELDS.filter(f => f.id === 'emailDestinataire')
          .map(field => ({ ...field, required: false, width: 'full' as const }));
      } else if (selectedTemplate === 'convocations') {
        // Pour les convocations, pas de champs coordonnées spécifiques, on saute directement au contenu
        return [];
      } else if (selectedTemplate === 'designation' || selectedTemplate === 'negociation' || selectedTemplate === 'custom') {
        // Pour designation, negociation et custom : coordonnées SANS codeDocument et SANS emailDestinataire
        // Adresse, Bâtiment et Code postal + Ville sur la même ligne en 3 colonnes
        const baseFields = COMMON_FIELDS.filter(f => ['entreprise', 'civiliteDestinataire', 'nomDestinataire', 'statutDestinataire'].includes(f.id));
        const adresseField = COMMON_FIELDS.find(f => f.id === 'adresse');
        const batimentField = COMMON_FIELDS.find(f => f.id === 'batiment');
        const cpVilleField = COMMON_FIELDS.find(f => f.id === 'cpVille');
        
        const result = [...baseFields];
        if (adresseField) result.push({ ...adresseField, width: 'third' as const });
        if (batimentField) result.push({ ...batimentField, width: 'third' as const });
        if (cpVilleField) result.push({ ...cpVilleField, width: 'third' as const });
        return result;
      } else {
        return COMMON_FIELDS.filter(f => ['codeDocument', 'entreprise', 'civiliteDestinataire', 'nomDestinataire', 'statutDestinataire', 'batiment', 'adresse', 'cpVille', 'emailDestinataire'].includes(f.id));
      }
    }

    if (stepId === 'contenu' && selectedTemplate) {
      // Gestion spéciale pour les convocations : champs dynamiques selon le type choisi
      if (selectedTemplate === 'convocations') {
        const typeConvocation = formData.typeConvocation;
        console.log('📋 getFieldsForStep contenu - typeConvocation:', typeConvocation);
        if (typeConvocation === 'CA Fédérale') {
          console.log('📋 Retourne champs CA Fédérale');
          return TEMPLATE_SPECIFIC_FIELDS['convocations_ca_federale'] || [];
        } else if (typeConvocation === 'Bureau Fédéral') {
          console.log('📋 Retourne champs Bureau Fédéral');
          return TEMPLATE_SPECIFIC_FIELDS['convocations_bureau_federal'] || [];
        }
        // Par défaut, afficher juste le sélecteur de type
        console.log('📋 Retourne champs par défaut (juste sélecteur)');
        return TEMPLATE_SPECIFIC_FIELDS['convocations'] || [];
      }
      
      // Pour designation, negociation et custom : ajouter codeDocument au début et signatureExp à la fin
      if (selectedTemplate === 'designation' || selectedTemplate === 'negociation' || selectedTemplate === 'custom') {
        const codeDocumentField = COMMON_FIELDS.find(f => f.id === 'codeDocument');
        const signatureField = COMMON_FIELDS.find(f => f.id === 'signatureExp');
        const templateFields = TEMPLATE_SPECIFIC_FIELDS[selectedTemplate] || [];
        const result: FormField[] = [];
        if (codeDocumentField) result.push(codeDocumentField);
        result.push(...templateFields);
        if (signatureField) result.push(signatureField);
        return result;
      }
      
      if (TEMPLATE_SPECIFIC_FIELDS[selectedTemplate]) {
        return TEMPLATE_SPECIFIC_FIELDS[selectedTemplate];
      }
    }

    // Gestion des onglets jour pour CA Fédérale
    if (stepId === 'jour1' && selectedTemplate === 'convocations' && formData.typeConvocation === 'CA Fédérale') {
      return TEMPLATE_SPECIFIC_FIELDS['convocations_ca_federale_jour1'] || [];
    }

    if (stepId === 'jour2' && selectedTemplate === 'convocations' && formData.typeConvocation === 'CA Fédérale') {
      return TEMPLATE_SPECIFIC_FIELDS['convocations_ca_federale_jour2'] || [];
    }

    // Gestion de l'onglet Ordre du jour pour Bureau Fédéral
    if (stepId === 'ordreDuJourBureau' && selectedTemplate === 'convocations' && formData.typeConvocation === 'Bureau Fédéral') {
      return TEMPLATE_SPECIFIC_FIELDS['convocations_bureau_federal_ordre_du_jour'] || [];
    }

    if (stepId === 'expediteur') {
      // Pour les convocations, seulement emailEnvoi (signatureExp déplacé dans Ordre du jour 2)
      if (selectedTemplate === 'convocations') {
        const emailEnvoiField: FormField = { 
          id: 'emailEnvoi', 
          label: 'Destinataires', 
          type: 'email', 
          placeholder: 'Sélectionnez les destinataires...', 
          required: true, 
          icon: 'group', 
          width: 'full' 
        };
        return [emailEnvoiField];
      }
      // Pour designation, negociation et custom, retourner emailDestinataire en pleine largeur (onglet Destinataire(s))
      if (selectedTemplate === 'designation' || selectedTemplate === 'negociation' || selectedTemplate === 'custom') {
        const emailField = COMMON_FIELDS.find(f => f.id === 'emailDestinataire');
        if (emailField) {
          return [{ ...emailField, width: 'full' as const }];
        }
        return [];
      }
      return COMMON_FIELDS.filter(f => f.id === 'signatureExp');
    }

    return FORM_FIELDS[stepId] || [];
  }, [selectedTemplate, customFieldsOrder, formData.typeConvocation]);

  // Vérifier si tous les champs requis d'une étape sont remplis ET valides
  const isStepValid = useCallback((stepId: StepType): boolean => {
    const fields = getFieldsForStep(stepId);
    const requiredFields = fields.filter(field => field.required);

    return requiredFields.every(field => {
      const value = formData[field.id];
      // Vérifier que le champ est rempli
      if (!value || value.trim() === '') {
        return false;
      }

      // Validation spécifique pour les emails
      if (field.id.toLowerCase().includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Pour la circulaire et convocations, accepter plusieurs emails séparés par des virgules
        if ((selectedTemplate === 'circulaire' && field.id === 'emailDestinataire') || (selectedTemplate === 'convocations' && field.id === 'emailEnvoi')) {
          const emails = value.split(',').map(e => e.trim()).filter(e => e);
          return emails.length > 0 && emails.every(email => emailRegex.test(email));
        }

        return emailRegex.test(value);
      }

      return true;
    });
  }, [formData, getFieldsForStep, selectedTemplate]);

  // Vérifier si tous les champs requis du formulaire sont remplis
  const areAllRequiredFieldsFilled = useMemo(() => {
    if (!selectedTemplate) return false;

    return availableSteps.every(step => isStepValid(step.id as StepType));
  }, [selectedTemplate, availableSteps, isStepValid]);

  // Sauvegarder les données du template actuel avant de changer
  const saveCurrentTemplateData = (templateId: string, data: FormData) => {
    console.log('💾 Sauvegarde des données pour:', templateId, data);
    setTemplateDataStore(prev => ({
      ...prev,
      [templateId]: data
    }));
  };

  // Gérer le changement de template (sauvegarder avant de changer)
  const handleTemplateChange = useCallback((newTemplateId: TemplateId) => {
    // Vérifier si un document a été généré pour le template actuel
    const hasGeneratedDocument = generatedWord !== null || pdfBlob !== null;

    // Sauvegarder les données du template actuel avant de changer
    if (selectedTemplate && Object.keys(formData).length > 0) {
      console.log('💾 Sauvegarde automatique avant changement de template');
      saveCurrentTemplateData(selectedTemplate, formData);
    }

    // Afficher un toast informatif si un document a été généré
    if (hasGeneratedDocument && selectedTemplate !== newTemplateId) {
      showInfo('Changement de template : le document précédent a été effacé. Vos données sont sauvegardées.');
    }

    // Changer de template
    setSelectedTemplate(newTemplateId);

    // Invalider le cache du document généré (évite la contamination entre templates)
    console.log('🗑️ Invalidation du cache document lors du changement de template');
    setGeneratedWord(null);
    setPdfBlob(null);
  }, [selectedTemplate, formData, generatedWord, pdfBlob, showInfo]);

  // Mettre à jour les champs du formulaire quand le template change
  useEffect(() => {
    if (selectedTemplate && TEMPLATE_SPECIFIC_FIELDS[selectedTemplate]) {
      // Réinitialiser à la première étape pour éviter les erreurs d'index
      setCurrentStepIdx(0);
      
      // Ajouter les champs spécifiques au template dans l'étape "contenu"
      FORM_FIELDS.contenu = TEMPLATE_SPECIFIC_FIELDS[selectedTemplate];

      // Pour la circulaire, filtrer les champs de coordonnées
      if (selectedTemplate === 'circulaire') {
        FORM_FIELDS.coordonnees = COMMON_FIELDS.filter(f => ['numeroCourrier', 'emailDestinataire'].includes(f.id));
      } else {
        // Pour les autres templates, utiliser tous les champs de coordonnées
        FORM_FIELDS.coordonnees = COMMON_FIELDS.filter(f => ['codeDocument', 'entreprise', 'civiliteDestinataire', 'nomDestinataire', 'statutDestinataire', 'batiment', 'adresse', 'cpVille', 'emailDestinataire'].includes(f.id));
      }

      // Restaurer les données du nouveau template s'il y en a
      const savedData = templateDataStore[selectedTemplate];
      if (savedData && Object.keys(savedData).length > 0) {
        console.log('📂 Restauration des données pour:', selectedTemplate, savedData);
        setFormData(savedData);
      } else {
        console.log('🆕 Nouveau template, données vides');
        // Pour les convocations, pré-remplir le signataire et le numéro de document par défaut
        if (selectedTemplate === 'convocations') {
          const defaultSignataire = 'Valentin RODRIGUEZ';
          // Extraire les initiales (VR pour Valentin RODRIGUEZ)
          const initials = defaultSignataire.replace(/-/g, ' ').trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase())
            .join('');
          const year = new Date().getFullYear();
          const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
          setFormData({ 
            signatureExp: defaultSignataire,
            codeDocument: `${initials}-${year}-${randomNum}`
          });
        } else {
          setFormData({});
        }
      }

      setCurrentStepIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  // État pour tracker les champs invalides (pour affichage en rouge)
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  // État pour tracker les champs supprimés par étape (pour le mode personnalisation)
  const [removedFieldsByStep, setRemovedFieldsByStep] = useState<Record<string, { field: FormField; originalIndex: number }[]>>({});

  // Optimisation: mémoriser handleStepChange pour éviter les re-renders
  const handleStepChange = useCallback((idx: number) => {
    // Pour les convocations, bloquer l'accès à l'étape signataire si le type n'est pas sélectionné
    if (selectedTemplate === 'convocations') {
      const targetStep = availableSteps[idx];
      if (targetStep?.id === 'expediteur' && !formData.typeConvocation) {
        // Afficher une alerte ou ne rien faire
        return;
      }
    }
    
    // Permettre la navigation libre entre les étapes
    // Ne plus bloquer la navigation même si les champs ne sont pas remplis
    setCurrentStepIdx(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedTemplate, availableSteps, formData.typeConvocation]);



  // Fonction pour extraire les initiales d'un nom
  const getInitials = (fullName: string): string => {
    if (!fullName) return '';
    const normalized = fullName.replace(/-/g, ' ').trim();
    const initials = normalized
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    return initials;
  };

  // Fonction pour générer un nom de fichier intelligent
  const generateFilename = useCallback((extension: 'docx' | 'pdf'): string => {
    let prefix = '';
    let suffix = '';

    // Récupérer le préfixe selon le template
    if (selectedTemplate === 'designation') {
      prefix = 'Designation';
    } else if (selectedTemplate === 'negociation') {
      prefix = 'Negociation';
    } else if (selectedTemplate === 'convocations') {
      // Pour convocations : utiliser le type de convocation
      const typeConvocation = formData.typeConvocation || '';
      if (typeConvocation === 'CA Fédérale') {
        prefix = 'Convocation_CA';
      } else if (typeConvocation === 'Bureau Fédéral') {
        prefix = 'Convocation_Bureau';
      } else {
        prefix = 'Convocation';
      }
    } else if (selectedTemplate === 'circulaire') {
      prefix = 'Circulaire';
    } else if (selectedTemplate === 'custom') {
      // Pour custom : utiliser l'objet du document
      const objet = formData.objet || '';
      if (objet) {
        // Extraire le dernier mot significatif de l'objet (ex: "Lettre de recommandation" -> "Recommandation")
        const words = objet.trim().split(/\s+/);
        const lastWord = words[words.length - 1];
        // Capitaliser la première lettre
        prefix = lastWord.charAt(0).toUpperCase() + lastWord.slice(1).toLowerCase();
      } else {
        prefix = 'Document';
      }
    } else {
      prefix = 'Document';
    }

    // Récupérer le suffixe selon le template
    if (selectedTemplate === 'circulaire') {
      // Pour circulaire : utiliser numeroCourrier
      const numeroCourrier = formData.numeroCourrier || '';
      suffix = numeroCourrier.trim() || new Date().getTime().toString();
    } else {
      // Pour les autres templates : nomDestinataire en priorité, sinon codeDocument, sinon timestamp
      const recipientName = formData.nomDestinataire || '';
      const codeDocument = formData.codeDocument || '';

      if (recipientName.trim()) {
        // Nettoyer le nom du destinataire (enlever espaces, convertir accents, enlever caractères spéciaux)
        suffix = recipientName
          .trim()
          .normalize('NFD')  // Décomposer les caractères accentués
          .replace(/[\u0300-\u036f]/g, '')  // Enlever les accents
          .replace(/\s+/g, '')  // Enlever les espaces
          .replace(/[^a-zA-Z0-9_-]/g, '');  // Enlever les caractères spéciaux
      } else if (codeDocument.trim()) {
        // Utiliser le code document tel quel (déjà un code propre)
        suffix = codeDocument.trim();
      } else {
        // Fallback : timestamp
        suffix = new Date().getTime().toString();
      }
    }

    return `${prefix}_${suffix}.${extension}`;
  }, [selectedTemplate, formData]);

  // Gestion du swipe mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLastStep) {
      // Swipe gauche = page suivante (navigation libre)
      handleStepChange(safeStepIdx + 1);
    }

    if (isRightSwipe && !isFirstStep) {
      // Swipe droite = page précédente
      handleStepChange(safeStepIdx - 1);
    }
  };

  // Optimisation: mémoriser handleInputChange
  const handleInputChange = useCallback((key: string, value: string) => {
    console.log('🔄 handleInputChange appelé:', key, '=', value);
    
    // Gestion spéciale pour le changement de type de convocation
    if (key === 'typeConvocation') {
      console.log('🎯 Changement de typeConvocation détecté:', value);
      setFormData(prev => {
        // Si même valeur, ne rien faire
        if (prev.typeConvocation === value) {
          return prev;
        }
        
        // Sauvegarder les données actuelles pour le type précédent (si il existe)
        if (prev.typeConvocation) {
          // Utiliser setTimeout pour éviter la mise à jour imbriquée
          setTimeout(() => {
            setConvocationDataStore(store => ({
              ...store,
              [prev.typeConvocation as string]: { ...prev }
            }));
          }, 0);
        }
        
        // Créer les nouvelles données
        const newData: FormData = {
          typeConvocation: value,
          signatureExp: prev.signatureExp || 'Valentin RODRIGUEZ',
          codeDocument: prev.codeDocument || ''
        };
        
        // Régénérer le codeDocument si nécessaire
        if (!newData.codeDocument && newData.signatureExp) {
          const initials = getInitials(newData.signatureExp as string);
          if (initials) {
            const year = new Date().getFullYear();
            const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            newData.codeDocument = `${initials}-${year}-${randomNum}`;
          }
        }
        
        return newData;
      });
      
      // Invalider le cache
      setGeneratedWord(null);
      setPdfBlob(null);
      
      return; // Sortir tôt pour éviter le traitement normal
    }

    // Traitement normal pour les autres champs
    setFormData(prev => {
      const newData = { ...prev, [key]: value };

      // Retirer le champ de la liste des invalides si l'utilisateur le remplit
      if (value && value.trim() !== '') {
        setInvalidFields(prevInvalid => {
          const newSet = new Set(prevInvalid);
          newSet.delete(key);
          return newSet;
        });
      }

      // Auto-génération du code document depuis signatureExp
      if (key === 'signatureExp' && value) {
        const initials = getInitials(value);
        if (initials) {
          const year = new Date().getFullYear();
          const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
          newData.codeDocument = `${initials}-${year}-${randomNum}`;
          // Le numéro de recommandé n'est plus auto-généré, c'est un champ normal obligatoire
        }
      }

      // Sauvegarder automatiquement les données du template actuel
      if (selectedTemplate) {
        saveCurrentTemplateData(selectedTemplate, newData);
      }
      return newData;
    });
    // Invalider le cache quand les données changent
    if (selectedTemplate) {
      setDocumentCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedTemplate];
        return newCache;
      });
    }
  }, [selectedTemplate]);

  // Obtenir tous les IDs de champs valides pour le template actuel
  const getValidFieldIds = useCallback((): string[] => {
    if (!selectedTemplate) return [];

    const fieldIds: string[] = [];

    // Récupérer les champs de toutes les étapes disponibles
    availableSteps.forEach(step => {
      const fields = getFieldsForStep(step.id as StepType);
      fields.forEach(field => {
        if (!fieldIds.includes(field.id)) {
          fieldIds.push(field.id);
        }
      });
    });

    // Toujours inclure templateType et templateName
    fieldIds.push('templateType', 'templateName');

    // Pour les convocations, toujours inclure typeConvocation et tous les champs possibles
    if (selectedTemplate === 'convocations') {
      const convocationFields = [
        'typeConvocation', 'dateDebut', 'heureDebut', 'dateFin', 'heureFin',
        'ordreDuJour1', 'ordreDuJour2', 'ordreDuJour3', 'ordreDuJour4',
        'ordreDuJour5', 'ordreDuJour6', 'ordreDuJour7', 'ordreDuJour8',
        'codeDocument', 'signatureExp'
      ];
      convocationFields.forEach(f => {
        if (!fieldIds.includes(f)) fieldIds.push(f);
      });
    }

    return fieldIds;
  }, [selectedTemplate, availableSteps, getFieldsForStep]);

  // Nettoyer les données du formulaire (supprimer les valeurs vides/undefined/null ET filtrer selon le template)
  const cleanFormData = useCallback((data: FormData): Record<string, string> => {
    const cleaned: Record<string, string> = {};
    const validFieldIds = getValidFieldIds();

    console.log(`📋 Valid field IDs pour ${selectedTemplate}:`, validFieldIds);
    console.log(`📋 FormData keys:`, Object.keys(data));
    console.log(`📋 typeConvocation dans formData:`, data.typeConvocation);

    Object.keys(data).forEach(key => {
      // Filtrer uniquement les champs valides pour ce template
      if (!validFieldIds.includes(key)) {
        console.log(`🚫 Champ "${key}" ignoré (non pertinent pour ${selectedTemplate})`);
        return;
      }

      const value = data[key];

      // Ignorer les valeurs undefined, null ou chaînes vides
      // Cela évite d'envoyer des champs vides au template Word
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Ne garder que les valeurs non vides (après trim)
      const stringValue = String(value).trim();
      if (stringValue !== '') {
        cleaned[key] = stringValue;
      }
    });

    console.log(`✅ Données nettoyées pour ${selectedTemplate}:`, cleaned);
    return cleaned;
  }, [selectedTemplate, getValidFieldIds]);

  // Créer un hash des données pour le cache
  const getDataHash = useCallback((data: FormData): string => {
    return JSON.stringify(data);
  }, []);

  const clearData = useCallback(() => {
    if(confirm('Voulez-vous vraiment effacer toutes les données ?')) {
        setFormData({});
        setGeneratedWord(null);
        setPdfBlob(null);
        // Effacer aussi les données sauvegardées du template actuel
        if (selectedTemplate) {
          saveCurrentTemplateData(selectedTemplate, {});
          // Invalider le cache
          setDocumentCache(prev => {
            const newCache = { ...prev };
            delete newCache[selectedTemplate];
            return newCache;
          });
        }
    }
  }, [selectedTemplate]);

  const toggleCustomization = useCallback(() => {
    setIsCustomizing(prev => !prev);
  }, []);

  const handleFieldsReorder = (stepId: string, newFields: FormField[]) => {
    // Clé unique par template + étape pour isoler les personnalisations
    const customKey = `${selectedTemplate}_${stepId}`;
    console.log('🔄 Réorganisation des champs pour', customKey, newFields);
    setCustomFieldsOrder(prev => ({
      ...prev,
      [customKey]: newFields
    }));
  };

  const handleRemovedFieldsChange = (stepId: string, removedFields: { field: FormField; originalIndex: number }[]) => {
    // Clé unique par template + étape pour isoler les suppressions
    const customKey = `${selectedTemplate}_${stepId}`;
    console.log('🗑️ Champs supprimés pour', customKey, removedFields);
    setRemovedFieldsByStep(prev => ({
      ...prev,
      [customKey]: removedFields
    }));
  };

  const fillTestData = () => {
      const testData = {
          codeDocument: "DOC-2024-001",
          entreprise: "ArcelorMittal France",
          civiliteDestinataire: "Monsieur",
          nomDestinataire: "Dupont",
          statutDestinataire: "Directeur des Ressources Humaines",
          batiment: "Bâtiment A",
          adresse: "15 rue des Hauts Fourneaux",
          cpVille: "59140 Dunkerque",
          emailDestinataire: "drh@arcelormittal.com",
          signatureExp: "Bruno REYNES",
          numeroCourrier: "2025-001",
          civiliteDelegue: "Monsieur",
          nomDelegue: "Jean Dupont",
          emailDelegue: "j.dupont@fo-metaux.org",
          civiliteRemplace: "Madame",
          nomRemplace: "Sophie Bernard"
      };
      setFormData(testData);
      // Sauvegarder les données de test pour le template actuel
      if (selectedTemplate) {
        saveCurrentTemplateData(selectedTemplate, testData);
      }
  };

  // Fonction pour valider et marquer les champs invalides
  const validateAndMarkInvalidFields = useCallback(() => {
    const invalid = new Set<string>();

    availableSteps.forEach(step => {
      const fields = getFieldsForStep(step.id as StepType);
      const requiredFields = fields.filter(field => field.required);

      requiredFields.forEach(field => {
        const value = formData[field.id];

        // Vérifier si le champ est vide
        if (!value || value.trim() === '') {
          invalid.add(field.id);
          return;
        }

        // Validation spécifique pour les emails
        if (field.id.toLowerCase().includes('email')) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          // Pour la circulaire et convocations, accepter plusieurs emails séparés par des virgules
          if ((selectedTemplate === 'circulaire' && field.id === 'emailDestinataire') || (selectedTemplate === 'convocations' && field.id === 'emailEnvoi')) {
            const emails = value.split(',').map(e => e.trim()).filter(e => e);
            const allValid = emails.every(email => emailRegex.test(email));
            if (!allValid || emails.length === 0) {
              invalid.add(field.id);
            }
          } else {
            // Pour les autres templates, un seul email
            if (!emailRegex.test(value)) {
              invalid.add(field.id);
            }
          }
        }
      });
    });

    setInvalidFields(invalid);
    return invalid.size === 0;
  }, [formData, getFieldsForStep, availableSteps]);

  const handlePreview = useCallback(async () => {
    if (isGenerating || !selectedTemplate) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      validateAndMarkInvalidFields();
      showError('Veuillez remplir tous les champs obligatoires (astérisque en rouge *) avant de générer le document');
      return;
    }

    setShowPreview(true);

    try {
      setIsGenerating(true);

      const dataHash = getDataHash(formData);
      const cached = documentCache[selectedTemplate];

      // Vérifier si on a déjà un document en cache avec les mêmes données
      if (cached && cached.dataHash === dataHash) {
        console.log('📦 Utilisation du cache pour', selectedTemplate);
        setGeneratedWord(cached.word);
        setPdfBlob(cached.pdf);
        showSuccess('Document chargé depuis le cache !');
        setIsGenerating(false);
        return;
      }

      // Préparer les données pour le webhook n8n
      const data = {
        templateType: selectedTemplate,
        templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
        ...cleanFormData(formData)
      };

      console.log('🔄 Génération du document pour', selectedTemplate);

      // Générer le Word
      const result = await generateWordDocument(data);
      setGeneratedWord(result.data);

      // Convertir en PDF pour la prévisualisation
      const pdfResult = await convertWordToPdf(result.data, `document_${selectedTemplate}`);
      setPdfBlob(pdfResult.blob);

      // Mettre en cache
      setDocumentCache(prev => ({
        ...prev,
        [selectedTemplate]: {
          word: result.data,
          pdf: pdfResult.blob,
          dataHash
        }
      }));

      showSuccess('Document généré avec succès !');
    } catch (error) {
      showError(`Erreur lors de la génération du document : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
      setShowPreview(false);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedTemplate, formData, documentCache, getDataHash, cleanFormData, showSuccess, showError, areAllRequiredFieldsFilled]);

  const handleDownload = useCallback(async () => {
    if (isGenerating || !selectedTemplate) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      validateAndMarkInvalidFields();
      showError('Veuillez remplir tous les champs obligatoires (astérisque en rouge *) avant de télécharger le document');
      return;
    }

    try {
      setIsGenerating(true);

      const dataHash = getDataHash(formData);
      const cached = documentCache[selectedTemplate];

      let wordBase64 = generatedWord;

      // Utiliser le cache si disponible
      if (!wordBase64 && cached && cached.dataHash === dataHash) {
        console.log('📦 Utilisation du cache Word pour téléchargement');
        wordBase64 = cached.word;
        setGeneratedWord(wordBase64);
      }

      // Générer si pas en cache
      if (!wordBase64) {
        const data = {
          templateType: selectedTemplate,
          templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
          ...cleanFormData(formData)
        };
        const result = await generateWordDocument(data);
        wordBase64 = result.data;
        setGeneratedWord(wordBase64);
      }

      const blob = base64ToBlob(wordBase64);
      const filename = generateFilename('docx');
      downloadBlob(blob, filename);
      showSuccess('Document Word téléchargé avec succès !');
    } catch (error) {
      showError(`Erreur lors du téléchargement : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedTemplate, formData, generatedWord, documentCache, getDataHash, cleanFormData, showSuccess, showError, areAllRequiredFieldsFilled, generateFilename]);

  const handleDownloadPdf = useCallback(async () => {
    if (isGenerating || !selectedTemplate) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      validateAndMarkInvalidFields();
      showError('Veuillez remplir tous les champs obligatoires (astérisque en rouge *) avant de télécharger le PDF');
      return;
    }

    try {
      setIsGenerating(true);

      const dataHash = getDataHash(formData);
      const cached = documentCache[selectedTemplate];

      // Utiliser le PDF déjà généré ou le cache
      let blob = pdfBlob;

      if (!blob && cached && cached.dataHash === dataHash) {
        console.log('📦 Utilisation du cache PDF pour téléchargement');
        blob = cached.pdf;
        setPdfBlob(blob);
      }

      if (!blob) {
        let wordBase64 = generatedWord;
        if (!wordBase64) {
          const data = {
            templateType: selectedTemplate,
            templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
            ...cleanFormData(formData)
          };
          const result = await generateWordDocument(data);
          wordBase64 = result.data;
          setGeneratedWord(wordBase64);
        }

        const pdfResult = await convertWordToPdf(wordBase64, `document_${selectedTemplate}`);
        blob = pdfResult.blob;
        setPdfBlob(blob);
      }

      const filename = generateFilename('pdf');
      downloadBlob(blob, filename);
      showSuccess('Document PDF téléchargé avec succès ! Vérifiez vos téléchargements.', 5000);
    } catch (error) {
      showError(`Erreur lors de la conversion PDF : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedTemplate, formData, pdfBlob, generatedWord, documentCache, getDataHash, cleanFormData, showSuccess, showError, areAllRequiredFieldsFilled, generateFilename]);

  const handleSendEmail = async (emails: string[], customMessage: string) => {
    if (isSending) return;

    // Vérifier que tous les champs requis sont remplis
    if (!areAllRequiredFieldsFilled) {
      validateAndMarkInvalidFields();
      showError('Veuillez remplir tous les champs obligatoires (astérisque en rouge *) avant de partager le document');
      return;
    }

    try {
      setIsSending(true);

      // Générer le Word si pas déjà fait
      let wordBase64 = generatedWord;
      if (!wordBase64) {
        const data = {
          templateType: selectedTemplate,
          templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
          ...cleanFormData(formData)
        };
        const result = await generateWordDocument(data);
        wordBase64 = result.data;
        setGeneratedWord(wordBase64);
      }

      // Convertir en PDF
      let pdfBase64: string;
      if (pdfBlob) {
        console.log('📄 PDF déjà en cache (blob), conversion en base64...');
        // Convertir le blob en base64
        const reader = new FileReader();
        pdfBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });
        console.log('📄 PDF base64 depuis cache:', pdfBase64 ? `${pdfBase64.length} caractères` : 'VIDE !');
      } else {
        console.log('📄 Pas de PDF en cache, appel conversion PowerShell...');
        const pdfResult = await convertWordToPdf(wordBase64, `document_${selectedTemplate}`);
        console.log('📄 Résultat conversion:', pdfResult);
        setPdfBlob(pdfResult.blob);
        // Convertir le blob en base64
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfResult.blob);
        });
        console.log('📄 PDF base64 après conversion:', pdfBase64 ? `${pdfBase64.length} caractères` : 'VIDE !');
      }

      // Envoyer l'email avec les destinataires multiples
      const data = {
        templateType: selectedTemplate,
        templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.title || selectedTemplate,
        ...cleanFormData(formData),
        emailEnvoi: emails.join(', ') // Joindre les emails avec des virgules pour n8n
      };

      // Générer le nom de fichier intelligent
      const filename = generateFilename('pdf');

      await sendEmailWithPdf(data, pdfBase64, customMessage, filename);

      // Tracker l'envoi du document dans le dashboard (avec le fichier pour stockage)
      try {
        await trackDocumentGeneration(
          selectedTemplate,
          filename,
          {
            format: 'pdf',
            destinataire: formData.nomDestinataire || '',
            email_envoi: emails.join(', '),
            emailDelegue: formData.emailDelegue || '',
            objet: formData.objet || '',
            action: 'email_sent'
          },
          pdfBase64 // Inclure le fichier pour stockage dans Supabase Storage
        );
        console.log('✅ Document tracké dans le dashboard avec fichier');
      } catch (trackingError) {
        console.warn('⚠️ Erreur tracking (non bloquant):', trackingError);
      }

      showSuccess('Email envoyé avec succès !');
      setShowShare(false);
    } catch (error) {
      showError(`Erreur lors de l'envoi de l'email : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // Afficher le chargement pendant la vérification de l'authentification
  if (authLoading) {
    return <AppSkeleton />;
  }

  // Callback quand le splash screen est terminé
  const handleSplashFinished = () => {
    setShowSplash(false);
    sessionStorage.setItem('docease-splash-shown', 'true');
  };

  // Afficher la page de connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <>
        {showSplash && <SplashScreen onFinished={handleSplashFinished} minDuration={1800} />}
        <LoginPage />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#2f2f2f] dark:bg-[rgb(18,18,18)] text-[#1c1b1f] dark:text-white">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinished={handleSplashFinished} minDuration={1800} />}
      
      {/* Sidebar */}
      <Sidebar
        templates={TEMPLATES}
        selectedTemplate={selectedTemplate}
        onSelect={handleTemplateChange}
        isOpenMobile={isSidebarOpen}
        setIsOpenMobile={setIsSidebarOpen}
        onDesktopCollapseChange={(collapsed) => setSidebarWidth(collapsed ? 88 : 280)}
        showSuccess={showSuccess}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          onPreview={handlePreview}
          onDownload={handleDownloadPdf}
          onShare={() => {
            if (!areAllRequiredFieldsFilled) {
              validateAndMarkInvalidFields();
              showError('Veuillez remplir tous les champs obligatoires (astérisque en rouge *) avant de partager le document');
              return;
            }
            setShowShare(true);
          }}
          hasData={hasData && areAllRequiredFieldsFilled}
          sidebarWidth={sidebarWidth}
        />

        <main className="flex-1 overflow-y-auto pb-8 px-4 md:px-8 lg:px-12 scroll-smooth pt-20">
          <PullToRefresh onRefresh={() => window.location.reload()} disabled={window.innerWidth < 768}>
            <div className="max-w-6xl mx-auto w-full pt-8">

              {/* Page Title */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-6 animate-[slideDown_0.5s_ease-out]">
              <div className="flex-shrink-0 w-[72px] h-[72px] flex items-center justify-center rounded-3xl bg-[#e062b1]/20 backdrop-blur-md shadow-inner border border-[#e062b1]/30">
                <span className="material-icons text-[#e062b1] text-4xl">edit_document</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-md">Génération de documents</h1>
                <p className="text-white/70 text-lg mt-1">
                   {selectedTemplate
                     ? `Modèle sélectionné : ${TEMPLATES.find(t => t.id === selectedTemplate)?.title}${selectedTemplate === 'convocations' && formData.typeConvocation ? ` - ${formData.typeConvocation}` : ''}`
                     : 'Créez vos documents professionnels en quelques clics.'}
                </p>
              </div>
            </div>

            {/* Floating Navigation Bar - IMPROVED MD3 Expressive - Masquée pour convocations sans type */}
            {!(selectedTemplate === 'convocations' && currentStep.id === 'contenu' && !formData.typeConvocation) && (
            <div className="sticky top-6 z-30 mb-10 mx-auto max-w-6xl px-1">
               <div className="bg-white/90 dark:bg-[#2f2f2f]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/10 p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:scale-[1.005] ring-1 ring-black/5 dark:ring-white/5 transform-gpu will-change-transform overflow-hidden">

                  {/* Step Indicators */}
                  <div
                    className={`flex items-center gap-1 md:gap-2 w-full md:w-auto px-1 py-1 scrollbar-thin scrollbar-mobile-hidden ${
                      availableSteps.length >= 4 
                        ? 'overflow-x-auto md:overflow-hidden snap-x snap-mandatory' 
                        : 'overflow-hidden'
                    }`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    {availableSteps.map((step, idx) => {
                      const isActive = safeStepIdx === idx;
                      const isCompleted = safeStepIdx > idx;
                      // Pour les convocations, désactiver l'étape signataire si le type n'est pas sélectionné
                      const isDisabled = selectedTemplate === 'convocations' && step.id === 'expediteur' && !formData.typeConvocation;

                      return (
                        <button
                          key={step.id}
                          onClick={() => !isDisabled && handleStepChange(idx)}
                          disabled={isDisabled}
                          title={isDisabled ? 'Veuillez d\'abord sélectionner le type de convocation' : undefined}
                          className={`
                            relative group flex items-center gap-2 md:gap-3 px-2 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] select-none min-w-0
                            ${availableSteps.length >= 4 ? 'snap-start flex-shrink-0' : ''}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isActive
                               ? 'bg-[#ffecf8] dark:bg-[#4a1a36] pr-3 md:pr-6 ' + (availableSteps.length < 4 ? 'flex-1 ' : '') + 'md:flex-none ring-1 ring-[#ffd8ec] dark:ring-[#a84383]'
                               : availableSteps.length < 4 ? 'flex-shrink-0' : ''}
                          `}
                        >
                           <div className={`
                             w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm z-10 flex-shrink-0
                             ${isActive
                               ? 'bg-[#2a2a2a] dark:bg-white text-white dark:text-[#2a2a2a] scale-100 rotate-0 shadow-md'
                               : isCompleted
                                 ? 'bg-[#2a2a2a] dark:bg-[#a84383] text-white scale-90 group-hover:scale-100'
                                 : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 scale-90 group-hover:text-gray-600 dark:group-hover:text-gray-200 group-hover:scale-100 group-hover:shadow-md'}
                           `}>
                             {isCompleted ? <span className="material-icons text-lg animate-[fadeIn_0.3s]">check</span> : idx + 1}
                           </div>

                           <div className={`flex flex-col items-start transition-all duration-500 overflow-hidden ${isActive ? 'max-w-[120px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-4'}`}>
                             <span className="font-bold text-sm text-[#2f2f2f] dark:text-white leading-none mb-1 truncate w-full">
                               {step.label}
                             </span>
                             <span className="text-[10px] text-gray-500 dark:text-gray-300 font-medium whitespace-nowrap leading-none uppercase tracking-wide">
                               Étape {idx + 1}/{availableSteps.length}
                             </span>
                           </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider - Desktop Only - Masqué aussi si la barre d'action est masquée */}
                  {!(selectedTemplate === 'convocations' && currentStep.id === 'contenu' && !formData.typeConvocation) && (
                  <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-[#9da3af] to-transparent mx-2"></div>
                  )}

                  {/* Actions Area - Masquée pour les convocations tant que le type n'est pas choisi */}
                  {!(selectedTemplate === 'convocations' && currentStep.id === 'contenu' && !formData.typeConvocation) && (
                  <div className="flex items-center justify-between w-full md:w-auto gap-3 md:gap-4 pl-1 md:pl-0">

                     {/* Utilities Group */}
                     <div className="flex items-center gap-1 bg-gray-50/80 dark:bg-[#1a1a1a]/80 rounded-full p-1 border border-gray-100/50 dark:border-gray-800/50 flex-shrink-0">
                       {/* Bouton Personnaliser (uniquement pour template custom) */}
                       {selectedTemplate === 'custom' && (
                         <button
                           onClick={toggleCustomization}
                           className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 group
                             ${isCustomizing
                               ? 'bg-[#3b5265] text-white shadow-md'
                               : 'text-gray-400 hover:text-[#3b5265] hover:bg-white dark:hover:bg-[#2f2f2f]'}
                           `}
                           title="Personnaliser les champs"
                         >
                           <span className={`material-icons text-[20px] group-hover:scale-110 transition-transform ${isCustomizing ? 'animate-[spin_1s_ease-out]' : ''}`}>
                             build
                           </span>
                         </button>
                       )}

                       <button
                         onClick={clearData}
                         className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 group ${
                           !hasNonEmptyData
                             ? 'text-[rgb(156,163,175)] cursor-default'
                             : 'text-[#aa4584] hover:text-[#8b3569] hover:bg-white dark:hover:bg-[#2f2f2f]'
                         }`}
                         title="Effacer tout"
                         disabled={!hasNonEmptyData}
                       >
                         <span className={`material-icons text-[20px] transition-transform ${hasNonEmptyData ? 'group-hover:scale-110' : ''}`}>delete_sweep</span>
                       </button>
                       {/* Bouton données de test */}
                       {false && (
                         <button
                           onClick={fillTestData}
                           className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#0072ff] hover:bg-white dark:hover:bg-[#2f2f2f] transition-all duration-300 group"
                           title="Données de test"
                         >
                           <span className="material-icons text-[20px] group-hover:scale-110 transition-transform">casino</span>
                         </button>
                       )}
                     </div>

                     {/* Navigation Group */}
                     <div className="flex items-center gap-2 flex-shrink-0">
                       <button
                         onClick={() => handleStepChange(safeStepIdx - 1)}
                         disabled={isFirstStep}
                         className={`
                           h-12 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 flex-shrink-0
                           ${isFirstStep
                             ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                             : 'text-[#1c1b1f] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 font-medium'}
                         `}
                       >
                          <span className="material-icons">arrow_back</span>
                          <span className="hidden sm:inline text-sm">Précédent</span>
                       </button>

                       <button
                         onClick={() => handleStepChange(safeStepIdx + 1)}
                         disabled={isLastStep || (selectedTemplate === 'convocations' && availableSteps[safeStepIdx + 1]?.id === 'expediteur' && !formData.typeConvocation)}
                         title={selectedTemplate === 'convocations' && availableSteps[safeStepIdx + 1]?.id === 'expediteur' && !formData.typeConvocation ? 'Veuillez d\'abord sélectionner le type de convocation' : undefined}
                         className={`
                           h-12 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-[#a84383]/30 dark:hover:shadow-[#e062b1]/30 transition-all duration-300 flex-shrink-0
                           ${isLastStep || (selectedTemplate === 'convocations' && availableSteps[safeStepIdx + 1]?.id === 'expediteur' && !formData.typeConvocation)
                             ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 cursor-not-allowed shadow-none'
                             : 'bg-[#a84383] dark:bg-[#e062b1] text-white active:scale-95'}
                         `}
                       >
                          <span className="font-bold text-sm hidden sm:inline">Suivant</span>
                          <span className="material-icons text-sm">arrow_forward</span>
                       </button>
                     </div>
                  </div>
                  )}
               </div>
            </div>
            )}

            {/* Form Content */}
            <div className="max-w-5xl mx-auto min-h-[400px]">
               <FormStep
                  key={`${selectedTemplate}_${currentStep.id}_${formData.typeConvocation || 'default'}`}
                  step={currentStep.id as StepType}
                  stepLabel={currentStep.label}
                  stepDescription={currentStep.description}
                  data={formData}
                  onChange={handleInputChange}
                  isCustomizing={isCustomizing && selectedTemplate === 'custom'}
                  customFields={getFieldsForStep(currentStep.id as StepType)}
                  onFieldsReorder={(newFields) => handleFieldsReorder(currentStep.id, newFields)}
                  invalidFields={invalidFields}
                  removedFields={removedFieldsByStep[`${selectedTemplate}_${currentStep.id}`] || []}
                  onRemovedFieldsChange={(removedFields) => handleRemovedFieldsChange(currentStep.id, removedFields)}
                  showInfo={showInfo}
                  showSuccess={showSuccess}
                  showError={showError}
                  selectedTemplate={selectedTemplate}
               />
               
               {isLastStep && (
                  <div className="mt-10 flex justify-end animate-[fadeInUp_0.5s_ease-out]">
                     <Button
                       variant="primary"
                       label="Prévisualiser le document"
                       icon="visibility"
                       className={`py-4 px-8 text-lg rounded-[2rem] shadow-xl hover:shadow-2xl hover:shadow-[#a84383]/20 ${!areAllRequiredFieldsFilled ? 'opacity-50 cursor-not-allowed' : ''}`}
                       onClick={handlePreview}
                     />
                  </div>
               )}
            </div>

          </div>
          
            <div className="mt-12">
              <Footer />
            </div>
          </PullToRefresh>
        </main>
      </div>

      {/* Modals avec Lazy Loading */}
      <Suspense fallback={<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"><div className="w-12 h-12 border-4 border-[#a84383] border-t-transparent rounded-full animate-spin"></div></div>}>
        {showPreview && (
          <PreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            pdfBlob={pdfBlob}
            isLoading={isGenerating}
            onDownloadWord={handleDownload}
            onDownloadPdf={handleDownloadPdf}
            onShare={() => {
              setShowPreview(false);
              setShowShare(true);
            }}
            filename={generateFilename('pdf')}
          />
        )}
        {showShare && (
          <ShareModal
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            onSend={handleSendEmail}
            isSending={isSending}
            defaultEmail={selectedTemplate === 'convocations' ? (formData.emailEnvoi as string) : (formData.emailDestinataire as string)}
            selectedTemplate={selectedTemplate || undefined}
            typeConvocation={formData.typeConvocation as string}
            dateDebut={formData.dateDebut as string}
            heureDebut={formData.heureDebut as string}
            numeroCourrier={formData.numeroCourrier as string}
            onDownload={handleDownloadPdf}
          />
        )}
      </Suspense>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isGenerating && !showPreview}
        message="Génération du document en cours..."
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}

      {/* Update Notification */}
      <UpdateNotification checkInterval={5 * 60 * 1000} />

      {/* PWA Install Banner */}
      <InstallPWAButton />

    </div>
  );
};

export default App;
