import { 
  FileText, Edit3, User, Mail, Newspaper, TrendingUp, Archive,
  Award, Activity, Users, BarChart3, Clock, ChevronRight, Globe, ExternalLink,
  Store, Calculator
} from 'lucide-react';
import { GlobalStat, UserStat, DocumentTypeStat, WeeklyActivity, ArchiveLink } from './types';

export const globalStats: GlobalStat[] = [
  {
    label: 'Lettres générées',
    value: '156',
    icon: FileText,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    trend: '+23 ce mois',
    description: 'Documents créés via Automate n8n'
  },
  {
    label: 'Signatures réalisées',
    value: '142',
    icon: Edit3,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    trend: '+18 ce mois',
    description: 'PDFs signés via SignEasy'
  },
  {
    label: 'Secrétaires actifs',
    value: '12',
    icon: User,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    trend: '8 connectés',
    description: 'Utilisateurs avec activité récente'
  },
  {
    label: 'Envois par email',
    value: '128',
    icon: Mail,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    trend: '91% livrés',
    description: 'Documents envoyés automatiquement'
  }
];

export const userStats: UserStat[] = [
  { name: 'Marie Dubois', letters: 34, signatures: 31, role: 'Secrétaire générale' },
  { name: 'Jean Martin', letters: 28, signatures: 25, role: 'Secrétaire adjoint' },
  { name: 'Sophie Bernard', letters: 22, signatures: 20, role: 'Secrétaire' },
  { name: 'Pierre Lefebvre', letters: 18, signatures: 18, role: 'Secrétaire' },
  { name: 'Claire Moreau', letters: 15, signatures: 14, role: 'Assistante' }
];

export const documentTypeStats: DocumentTypeStat[] = [
  { type: 'Lettre de réclamation', count: 45, percentage: 29, color: 'bg-red-500' },
  { type: 'Convocation réunion', count: 38, percentage: 24, color: 'bg-blue-500' },
  { type: 'Courrier employeur', count: 32, percentage: 21, color: 'bg-purple-500' },
  { type: 'Compte-rendu', count: 25, percentage: 16, color: 'bg-green-500' },
  { type: 'Autres', count: 16, percentage: 10, color: 'bg-slate-400' }
];

export const weeklyActivity: WeeklyActivity[] = [
  { day: 'Lun', letters: 18, signatures: 15 },
  { day: 'Mar', letters: 22, signatures: 20 },
  { day: 'Mer', letters: 25, signatures: 23 },
  { day: 'Jeu', letters: 20, signatures: 18 },
  { day: 'Ven', letters: 28, signatures: 26 },
  { day: 'Sam', letters: 8, signatures: 7 },
  { day: 'Dim', letters: 5, signatures: 5 }
];

export const archiveLinks: ArchiveLink[] = [
  { name: "Actualités sociales et juridiques", url: "https://www.fo-metaux.org/articles?type=5", icon: Newspaper },
  { name: "Convention Collective", url: "https://conventioncollectivemetallurgie.fr/", icon: FileText },
  { name: "Espace formation", url: "https://fometauxformation.fr/", icon: TrendingUp },
  { name: "Mystore FO", url: "https://mystorefo.fr/", icon: Store },
  { name: "Calculateur de prime d'ancienneté", url: "https://www.fo-metaux.fr/calculateur-de-prime-danciennet", icon: Calculator },
  { name: "Réseau des USM", url: "https://www.fo-metaux.fr/federation-fo-de-la-metallurgie/c/0", icon: Users }
];