import { useCallback, useMemo } from 'react';
import { StepType, FormData, FormField } from '../types';
import { FORM_FIELDS } from '../constants';
import { CustomFieldsOrder } from '../types';

/**
 * Hook personnalisé pour la validation du formulaire
 */
export const useFormValidation = (
  formData: FormData,
  selectedTemplate: string | null,
  customFieldsOrder: CustomFieldsOrder
) => {
  // Vérifier si tous les champs requis d'une étape sont remplis
  const isStepValid = useCallback((stepId: StepType): boolean => {
    const fields = customFieldsOrder[stepId] || FORM_FIELDS[stepId] || [];
    const requiredFields = fields.filter(field => field.required);
    
    return requiredFields.every(field => {
      const value = formData[field.id];
      return value !== undefined && value !== null && value.trim() !== '';
    });
  }, [formData, customFieldsOrder]);

  // Vérifier si tous les champs requis du formulaire sont remplis
  const areAllRequiredFieldsFilled = useMemo(() => {
    if (!selectedTemplate) return false;
    
    const steps: StepType[] = ['coordonnees', 'contenu', 'expediteur'];
    return steps.every(step => isStepValid(step));
  }, [selectedTemplate, isStepValid]);

  // Vérifier si le formulaire a des données
  const hasData = useMemo(
    () => Object.keys(formData).length > 0 && selectedTemplate !== null,
    [formData, selectedTemplate]
  );

  return {
    isStepValid,
    areAllRequiredFieldsFilled,
    hasData,
  };
};

