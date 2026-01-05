/**
 * Module de gestion de l'identification utilisateur pour le tracking
 */

/**
 * Récupérer l'email utilisateur depuis localStorage
 */
export const getUserEmail = (): string | null => {
  return localStorage.getItem('userEmail');
};

/**
 * Enregistrer l'email utilisateur dans localStorage
 */
export const setUserEmail = (email: string): void => {
  localStorage.setItem('userEmail', email);
};

/**
 * Demander l'email à l'utilisateur via prompt (au premier usage)
 */
export const promptUserEmail = (): string | null => {
  const currentEmail = getUserEmail();
  
  if (currentEmail) {
    return currentEmail;
  }
  
  const email = prompt(
    '📧 Pour suivre vos statistiques sur le dashboard,\nveuillez entrer votre adresse email professionnelle :'
  );
  
  if (email && email.trim()) {
    const trimmedEmail = email.trim();
    setUserEmail(trimmedEmail);
    return trimmedEmail;
  }
  
  return null;
};

/**
 * Hook pour initialiser l'email utilisateur au démarrage de l'app
 */
export const initUserIdentification = (): void => {
  // Demander l'email seulement s'il n'existe pas
  if (!getUserEmail()) {
    promptUserEmail();
  }
};
