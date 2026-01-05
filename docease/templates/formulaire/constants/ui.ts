/**
 * Constantes UI pour l'application
 */

// Couleurs
export const COLORS = {
  primary: '#a84383',
  primaryDark: '#8d3669',
  primaryLight: '#aa4584',
  secondary: '#dd60b0',
  accent: '#e062b1',
  dark: '#2f2f2f',
  darkText: '#1c1b1f',
  error: '#e04142',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Durées d'animation (en ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const;

// Durées de toast (en ms)
export const TOAST_DURATION = {
  short: 2000,
  normal: 3000,
  long: 5000,
} as const;

// Tailles de spinner
export const SPINNER_SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
} as const;

// Z-index layers
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// Breakpoints (en px)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Tailles de conteneur
export const CONTAINER_SIZES = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
} as const;

// Messages d'erreur communs
export const ERROR_MESSAGES = {
  required: 'Ce champ est requis',
  invalidEmail: 'Format d\'email invalide',
  invalidPhone: 'Format de téléphone invalide (ex: 01 23 45 67 89)',
  invalidPostalCode: 'Code postal invalide (5 chiffres requis)',
  minLength: (min: number) => `Minimum ${min} caractères requis`,
  maxLength: (max: number) => `Maximum ${max} caractères autorisés`,
  networkError: 'Erreur de connexion. Veuillez réessayer.',
  serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
  unknownError: 'Une erreur inconnue est survenue',
  generationError: 'Erreur lors de la génération du document',
  downloadError: 'Erreur lors du téléchargement',
  sendError: 'Erreur lors de l\'envoi de l\'email',
  validationError: 'Veuillez remplir tous les champs obligatoires',
} as const;

// Messages de succès communs
export const SUCCESS_MESSAGES = {
  documentGenerated: 'Document généré avec succès !',
  documentDownloaded: 'Document téléchargé avec succès !',
  emailSent: 'Email envoyé avec succès !',
  dataSaved: 'Données sauvegardées',
  dataCleared: 'Données effacées',
  cacheLoaded: 'Document chargé depuis le cache !',
} as const;

// Limites de validation
export const VALIDATION_LIMITS = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minTextLength: 1,
  maxTextLength: 500,
  maxTextareaLength: 5000,
  maxEmailLength: 254,
  postalCodeLength: 5,
} as const;

// Timeouts (en ms)
export const TIMEOUTS = {
  debounce: 300,
  apiRequest: 30000, // 30 secondes
  longApiRequest: 60000, // 1 minute
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
  postalCode: /^\d{5}$/,
  url: /^https?:\/\/.+/,
} as const;

// Noms de fichiers
export const FILE_NAMES = {
  wordPrefix: 'document',
  pdfPrefix: 'document',
  wordExtension: '.docx',
  pdfExtension: '.pdf',
} as const;

// MIME types
export const MIME_TYPES = {
  word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  json: 'application/json',
} as const;

