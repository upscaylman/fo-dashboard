
import { LucideIcon } from 'lucide-react';

export interface GlobalStat {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend: string;
  description: string;
}

export interface UserStat {
  name: string;
  letters: number;
  signatures: number;
  role: string;
}

export interface DocumentTypeStat {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WeeklyActivity {
  day: string;
  letters: number;
  signatures: number;
}

export interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  url: string;
}

export interface ArchiveLink {
  name: string;
  url: string;
  icon: LucideIcon;
}
