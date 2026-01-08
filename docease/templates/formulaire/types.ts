// Types de base
export type TemplateId = 'designation' | 'negociation' | 'custom' | 'circulaire' | 'convocations';
export type StepType = 'coordonnees' | 'contenu' | 'expediteur' | 'jour1' | 'jour2' | 'ordreDuJourBureau';
export type ConvocationType = 'ca_federale' | 'bureau_federal';
export type FieldType = 'text' | 'email' | 'textarea' | 'date' | 'time' | 'select';
export type FieldWidth = 'full' | 'half';

// Template
export interface Template {
  id: TemplateId;
  title: string;
  description?: string;
  image: string;
  category?: string;
}

// Champ de formulaire
export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  width?: FieldWidth;
  required?: boolean;
  icon?: string;
  rows?: number;
  maxLength?: number;
  hasUppercaseToggle?: boolean; // Affiche une case à cocher pour mettre en majuscules
  forceUppercase?: boolean; // Force les majuscules sans toggle
}

// Données du formulaire
export interface FormData {
  [key: string]: string;
}

// Configuration d'étape
export interface StepConfig {
  id: StepType;
  label: string;
  icon: string;
  description: string;
}

// Résultat de validation
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Résultat d'API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Résultat de génération de document
export interface DocumentGenerationResult {
  success: boolean;
  data: string; // base64
}

// Résultat de conversion PDF
export interface PdfConversionResult {
  success: boolean;
  blob: Blob;
  filename: string;
}

// Résultat d'envoi d'email
export interface EmailSendResult {
  success: boolean;
  message: string;
}

// Cache de document
export interface DocumentCache {
  word: string; // base64
  pdf: Blob;
  dataHash: string;
}

// Store de données par template
export interface TemplateDataStore {
  [templateId: string]: FormData;
}

// Ordre personnalisé des champs
export interface CustomFieldsOrder {
  [stepId: string]: FormField[];
}

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

// Props des composants
export interface HeaderProps {
  onPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
  hasData: boolean;
}

export interface SidebarProps {
  templates: Template[];
  selectedTemplate: TemplateId | null;
  onSelect: (templateId: TemplateId) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (isOpen: boolean) => void;
}

export interface FormStepProps {
  step: StepType;
  data: FormData;
  onChange: (fieldId: string, value: string) => void;
  isCustomizing?: boolean;
  customFields?: FormField[];
  onFieldsReorder?: (newFields: FormField[]) => void;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'tonal';
  icon?: string;
  label?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  type?: FieldType;
  options?: string[];
  icon?: string;
  error?: string;
  onValidate?: (isValid: boolean, error?: string) => void;
  fieldId?: string;
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
