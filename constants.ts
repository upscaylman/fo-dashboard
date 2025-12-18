import { 
  FileText, Newspaper, TrendingUp, Users, Store, Calculator
} from 'lucide-react';
import { ArchiveLink } from './types';

// Liens utiles de l'écosystème FO Metaux
export const archiveLinks: ArchiveLink[] = [
  { name: "Actualités sociales et juridiques", url: "https://www.fo-metaux.org/articles?type=5", icon: Newspaper },
  { name: "Convention Collective", url: "https://conventioncollectivemetallurgie.fr/", icon: FileText },
  { name: "Espace formation", url: "https://fometauxformation.fr/", icon: TrendingUp },
  { name: "Mystore FO", url: "https://mystorefo.fr/", icon: Store },
  { name: "Calculateur de prime d'ancienneté", url: "https://www.fo-metaux.fr/calculateur-de-prime-danciennet", icon: Calculator },
  { name: "Réseau des USM", url: "https://www.fo-metaux.fr/federation-fo-de-la-metallurgie/c/0", icon: Users }
];