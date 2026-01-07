import { Template, StepConfig, FormField, TemplateId, StepType } from './types';

// Exporter aussi les constantes UI
export * from './constants/ui';

// Emails prédéfinis pour la circulaire
export const PREDEFINED_EMAILS = [
  { name: 'Bruno REYNES', email: 'breynes@fo-metaux.fr' },
  { name: 'Eric KELLER', email: 'ekeller@fo-metaux.fr' },
  { name: 'Edwin LIARD', email: 'eliard@fo-metaux.fr' },
  { name: 'Gérard CIANNARELLA', email: 'gciannarella@fo-metaux.fr' },
  { name: 'Géraldine GOMIZ', email: 'ggomiz@fo-metaux.fr' },
  { name: 'Jean-Yves SABOT', email: 'jysabot@fo-metaux.fr' },
  { name: 'Nathalie CAPART', email: 'ncapart@fo-metaux.fr' },
  { name: 'Olivier LEFEBVRE', email: 'olefebvre@fo-metaux.fr' },
  { name: 'Paul RIBEIRO', email: 'pribeiro@fo-metaux.fr' },
  { name: 'Valentin RODRIGUEZ', email: 'vrodriguez@fo-metaux.fr' },
];

export const TEMPLATES: Template[] = [
  {
    id: 'designation',
    title: 'Lettre de Désignation',
    description: 'Désignation de délégué syndical',
    image: '/assets/img/designation_template.png'
  },
  {
    id: 'negociation',
    title: 'Mandat de Négociation',
    description: 'Mandat de négociation collective',
    image: '/assets/img/nego_template.png'
  },
  {
    id: 'convocations',
    title: 'Convocations',
    description: 'Convocations Bureau ou CA Fédérale',
    image: '/assets/img/convocations_template.png'
  },
  {
    id: 'custom',
    title: 'Document Personnalisé',
    description: 'Document personnalisé avec contenu IA',
    image: '/assets/img/custom_template.png'
  },
  {
    id: 'circulaire',
    title: 'Circulaire',
    description: 'Circulaire d\'informations',
    image: '/assets/img/circulaire_template.png'
  },
];

export const STEPS: StepConfig[] = [
  { id: 'coordonnees', label: 'Coordonnées', icon: 'person', description: 'Informations du destinataire' },
  { id: 'contenu', label: 'Contenu', icon: 'article', description: 'Détails de la demande' },
  { id: 'jour1', label: 'Ordre du jour 1', icon: 'today', description: 'Ordre du jour - 1ère journée' },
  { id: 'jour2', label: 'Ordre du jour 2', icon: 'event', description: 'Ordre du jour - 2ème journée' },
  { id: 'expediteur', label: 'Signataire', icon: 'send', description: 'Choix du Secrétaire Fédéral' },
];

// Champs communs à tous les templates
export const COMMON_FIELDS: FormField[] = [
  { id: 'codeDocument', label: 'Numéro du document', type: 'text', placeholder: 'Ex : DOC-2024-001', required: true, icon: 'description', width: 'half', forceUppercase: true },
  { id: 'numeroCourrier', label: 'Numéro de la Circulaire', type: 'text', placeholder: 'Ex: 2025-001', required: true, icon: 'tag', width: 'half' },
  { id: 'entreprise', label: 'Entreprise', type: 'text', placeholder: 'Ex: ACME Corp', required: true, icon: 'business', width: 'half' },
  { id: 'civiliteDestinataire', label: 'Civilité Destinataire', type: 'select', options: ['Monsieur', 'Madame', 'Monsieur et Madame'], required: false, width: 'half' },
  { id: 'nomDestinataire', label: 'Nom Destinataire', type: 'text', placeholder: 'Ex: Dupont', required: false, icon: 'person', width: 'half' },
  { id: 'statutDestinataire', label: 'Statut Destinataire', type: 'text', placeholder: 'Ex: Président, Directeur...', required: false, icon: 'work', width: 'half', hasUppercaseToggle: true },
  { id: 'batiment', label: 'Bâtiment', type: 'text', placeholder: 'Ex: Bâtiment A', required: false, icon: 'apartment', width: 'half' },
  { id: 'adresse', label: 'Adresse', type: 'text', placeholder: 'Ex: 123 rue de la Paix', required: false, icon: 'place', width: 'full' },
  { id: 'cpVille', label: 'Code postal + Ville', type: 'text', placeholder: 'Ex: 75001 Paris', required: false, icon: 'location_city', width: 'half' },
  { id: 'emailDestinataire', label: 'Email Destinataire', type: 'email', placeholder: 'destinataire@exemple.com', required: true, icon: 'email', width: 'half' },
  { id: 'signatureExp', label: 'Secrétaire Fédéral', type: 'select', options: [
    'Bruno REYNES', 'Eric KELLER', 'Edwin LIARD', 'Gérard CIANNARELLA',
    'Géraldine GOMIZ', 'Jean-Yves SABOT', 'Nathalie CAPART',
    'Olivier LEFEBVRE', 'Paul RIBEIRO', 'Valentin RODRIGUEZ'
  ], required: true, icon: 'edit', width: 'full' },
];

// Champs spécifiques par template
export const TEMPLATE_SPECIFIC_FIELDS: Record<string, FormField[]> = {
  designation: [
    { id: 'numeroCourrier', label: 'Numéro de Recommandé', type: 'text', placeholder: 'Ex: 2025-001', required: true, icon: 'tag', width: 'half' },
    { id: 'civiliteDelegue', label: 'Civilité Délégué(e) Nommé(e)', type: 'select', options: ['Monsieur', 'Madame'], required: true, width: 'half' },
    { id: 'nomDelegue', label: 'Nom Délégué(e) Nommé(e)', type: 'text', placeholder: 'Ex: Martin Dupont', required: true, icon: 'person', width: 'half' },
    { id: 'emailDelegue', label: 'Email Délégué(e) Nommé(e)', type: 'email', placeholder: 'delegue@exemple.com', required: true, icon: 'email', width: 'half' },
    { id: 'civiliteRemplace', label: 'Civilité du/de la Remplaçé(e)', type: 'select', options: ['Monsieur', 'Madame'], required: true, width: 'half' },
    { id: 'nomRemplace', label: 'Nom du/de la Remplaçé(e)', type: 'text', placeholder: 'Ex: Sophie Bernard', required: true, icon: 'person', width: 'half' },
  ],
  negociation: [
    { id: 'objet', label: 'Objet du Mandat', type: 'text', placeholder: 'Ex: Négociation accord temps de travail', required: true, icon: 'subject', width: 'full' },
    { id: 'civiliteDelegue', label: 'Civilité du Mandataire', type: 'select', options: ['Monsieur', 'Madame'], required: true, width: 'half' },
    { id: 'nomDelegue', label: 'Nom du Mandataire', type: 'text', placeholder: 'Ex: Jean Durand', required: true, icon: 'person', width: 'half' },
    { id: 'emailDelegue', label: 'Email du Mandataire', type: 'email', placeholder: 'mandataire@exemple.com', required: true, icon: 'email', width: 'half' },
  ],
  convocations: [
    { id: 'typeConvocation', label: 'Type de convocation à générer', type: 'select', options: ['CA Fédérale', 'Bureau Fédéral'], required: true, icon: 'category', width: 'full' },
  ],
  // Champs spécifiques pour CA Fédérale - Page Contenu (dates et heures uniquement)
  convocations_ca_federale: [
    { id: 'typeConvocation', label: 'Type de convocation à générer', type: 'select', options: ['CA Fédérale', 'Bureau Fédéral'], required: true, icon: 'category', width: 'full' },
    { id: 'dateDebut', label: 'Date de début', type: 'date', required: true, icon: 'event', width: 'half' },
    { id: 'heureDebut', label: 'Heure de début', type: 'time', placeholder: 'Ex: 09h00', required: true, icon: 'schedule', width: 'half' },
    { id: 'dateFin', label: 'Date de fin', type: 'date', required: true, icon: 'event', width: 'half' },
    { id: 'heureFin', label: 'Heure de fin', type: 'time', placeholder: 'Ex: 17h00', required: true, icon: 'schedule', width: 'half' },
  ],
  // Champs CA Fédérale - 1er jour (ordres du jour 1-4)
  convocations_ca_federale_jour1: [
    { id: 'ordreDuJour1', label: 'Point 1', type: 'text', placeholder: 'Premier point à l\'ordre du jour', required: true, icon: 'list', width: 'full' },
    { id: 'ordreDuJour2', label: 'Point 2', type: 'text', placeholder: 'Deuxième point à l\'ordre du jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour3', label: 'Point 3', type: 'text', placeholder: 'Troisième point à l\'ordre du jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour4', label: 'Point 4', type: 'text', placeholder: 'Quatrième point à l\'ordre du jour', required: false, icon: 'list', width: 'full' },
  ],
  // Champs CA Fédérale - 2ème jour (ordres du jour 5-8)
  convocations_ca_federale_jour2: [
    { id: 'ordreDuJour5', label: 'Point 1', type: 'text', placeholder: 'Premier point du 2ème jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour6', label: 'Point 2', type: 'text', placeholder: 'Deuxième point du 2ème jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour7', label: 'Point 3', type: 'text', placeholder: 'Troisième point du 2ème jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour8', label: 'Point 4', type: 'text', placeholder: 'Quatrième point du 2ème jour', required: false, icon: 'list', width: 'full' },
  ],
  // Champs spécifiques pour Bureau Fédéral
  convocations_bureau_federal: [
    { id: 'typeConvocation', label: 'Type de convocation à générer', type: 'select', options: ['CA Fédérale', 'Bureau Fédéral'], required: true, icon: 'category', width: 'full' },
    { id: 'dateDebut', label: 'Date de la réunion', type: 'date', required: true, icon: 'event', width: 'half' },
    { id: 'heureDebut', label: 'Heure de début', type: 'time', placeholder: 'Ex: 09h00', required: true, icon: 'schedule', width: 'half' },
    { id: 'ordreDuJour1', label: 'Point 1', type: 'text', placeholder: 'Premier point à l\'ordre du jour', required: true, icon: 'list', width: 'full' },
    { id: 'ordreDuJour2', label: 'Point 2', type: 'text', placeholder: 'Deuxième point à l\'ordre du jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour3', label: 'Point 3', type: 'text', placeholder: 'Troisième point à l\'ordre du jour', required: false, icon: 'list', width: 'full' },
    { id: 'ordreDuJour4', label: 'Point 4', type: 'text', placeholder: 'Quatrième point à l\'ordre du jour', required: false, icon: 'list', width: 'full' },
  ],
  circulaire: [
    { id: 'objet', label: 'Objet de la Circulaire', type: 'text', placeholder: 'Ex: Information importante', required: true, icon: 'subject', width: 'full' },
    { id: 'circulaireTexteA', label: 'Contenu de la Circulaire', type: 'textarea', placeholder: 'Saisissez le contenu de la circulaire...', required: true, icon: 'description', rows: 8, width: 'full' },
    { id: 'circulaireTexteB', label: 'Autres contenu', type: 'textarea', placeholder: 'Saisissez d\'autres contenus...', required: true, icon: 'edit_note', rows: 8, width: 'full' },
  ],
  custom: [
    { id: 'objet', label: 'Objet du Document', type: 'text', placeholder: 'Ex: Demande d\'information', required: true, icon: 'subject', width: 'full' },
    { id: 'texteIa', label: 'Contenu du Document', type: 'textarea', placeholder: 'Saisissez le contenu du document (minimum 10 caractères pour déclencher l\'IA)...', required: true, icon: 'edit_note', rows: 5, width: 'full', maxLength: 800 },
  ],
};

export const FORM_FIELDS: Record<string, FormField[]> = {
  coordonnees: COMMON_FIELDS.filter(f => ['codeDocument', 'entreprise', 'civiliteDestinataire', 'nomDestinataire', 'statutDestinataire', 'batiment', 'adresse', 'cpVille', 'emailDestinataire'].includes(f.id)),
  contenu: [], // Sera rempli dynamiquement selon le template sélectionné
  expediteur: COMMON_FIELDS.filter(f => f.id === 'signatureExp'),
};
