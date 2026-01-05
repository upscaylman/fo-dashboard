/**
 * Utilitaires de validation des champs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valider une adresse email
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'L\'email est requis' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }

  return { isValid: true };
};

/**
 * Valider un numéro de téléphone français
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Téléphone optionnel
  }

  // Formats acceptés: 0123456789, 01 23 45 67 89, 01.23.45.67.89, +33123456789
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Format de téléphone invalide (ex: 01 23 45 67 89)' };
  }

  return { isValid: true };
};

/**
 * Valider un code postal français
 */
export const validatePostalCode = (postalCode: string): ValidationResult => {
  // Pas de validation stricte - accepter chiffres et lettres
  return { isValid: true };
};

/**
 * Valider un champ requis
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} est requis` };
  }

  return { isValid: true };
};

/**
 * Valider la longueur minimale
 */
export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  if (value && value.length < minLength) {
    return { isValid: false, error: `${fieldName} doit contenir au moins ${minLength} caractères` };
  }

  return { isValid: true };
};

/**
 * Valider la longueur maximale
 */
export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
  if (value && value.length > maxLength) {
    return { isValid: false, error: `${fieldName} ne peut pas dépasser ${maxLength} caractères` };
  }

  return { isValid: true };
};

/**
 * Valider un champ selon son type
 */
export const validateField = (value: string, fieldId: string, fieldLabel: string, isRequired: boolean = false): ValidationResult => {
  // Vérifier si requis
  if (isRequired) {
    const requiredResult = validateRequired(value, fieldLabel);
    if (!requiredResult.isValid) {
      return requiredResult;
    }
  }

  // Validation spécifique selon le type de champ
  if (fieldId.includes('email') || fieldId.includes('Email')) {
    return validateEmail(value);
  }

  if (fieldId.includes('telephone') || fieldId.includes('phone')) {
    return validatePhone(value);
  }

  if (fieldId.includes('cp') || fieldId.includes('codePostal')) {
    return validatePostalCode(value);
  }

  return { isValid: true };
};

/**
 * Valider tous les champs d'un formulaire
 */
export const validateForm = (data: Record<string, string>, requiredFields: string[]): Record<string, string> => {
  const errors: Record<string, string> = {};

  requiredFields.forEach(fieldId => {
    const value = data[fieldId] || '';
    const result = validateField(value, fieldId, fieldId, true);
    
    if (!result.isValid && result.error) {
      errors[fieldId] = result.error;
    }
  });

  return errors;
};

