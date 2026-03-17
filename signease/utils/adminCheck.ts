// Vérification admin légère - séparée de firebaseApi pour ne pas charger
// tout Firebase + node-forge au démarrage

const ADMIN_EMAILS = [
  "bouvier.jul@gmail.com",
  "vrodriguez@fo-metaux.fr",
  "aguillermin@fo-metaux.fr",
];

export const isAdmin = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
