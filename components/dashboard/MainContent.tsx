import React, { useState, useEffect } from 'react';
import { FileText, Edit3, ChevronRight, Newspaper, Clock, Zap, ArrowDown, ArrowUp, FileSpreadsheet, Download, AlertCircle, RefreshCw, ExternalLink, Star, Plus, Trash2, X, Search, File, ChevronDown, Image, Film, Grid, List, HardDrive, Calendar, User, Filter, Upload, Settings } from 'lucide-react';
import { NewsItem } from '../../types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { Tooltip } from '../ui/Tooltip';
import { Skeleton } from '../ui/Skeleton';
import { useBookmarks } from '../../context/BookmarkContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { DOCEASE_URL, SIGNEASE_URL } from '../../constants';
import DocumentsManagementPanel from './DocumentsManagementPanel';

// Rôles qui ne peuvent PAS ajouter/supprimer de documents
const RESTRICTED_ROLES = ['secretary_federal'];

interface MainContentProps {
  news: NewsItem[];
  loading: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface SharedDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: string;
  category: string;
  description?: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
}

const monthMap: { [key: string]: number } = {
  'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
  'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
};

function parseFrenchDate(dateString: string): Date {
  const parts = dateString.toLowerCase().split(' ');
  if (parts.length < 3) return new Date(0);
  const day = parseInt(parts[0], 10);
  const monthName = parts[1];
  const year = parseInt(parts[2], 10);
  const month = monthMap[monthName];
  if (isNaN(day) || month === undefined || isNaN(year)) return new Date(0);
  return new Date(year, month, day);
}

function isNewsRecent(dateString: string): boolean {
  const newsDate = parseFrenchDate(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - newsDate.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return diffInHours <= 48; // Nouveau si publié dans les dernières 48h
}

const NewsSkeleton: React.FC = () => (
    <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-5 p-4 rounded-2xl border border-transparent">
                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                </div>
                <Skeleton className="w-8 h-8 rounded-full" />
            </div>
        ))}
    </div>
);

// Liste des modèles pointant vers le dossier /public/templates/
const templates = [
    { 
        id: 1, 
        name: "Liste Globale Destinataires", 
        type: "excel", 
        size: "Macro XLSM", 
        url: "/templates/LISTE GLOBALE DESTINATAIRES-REORGANISE.xlsm" 
    },
    { 
        id: 2, 
        name: "Modèle Désignation", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_designation.docx" 
    },
    { 
        id: 3, 
        name: "Modèle Négociation", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_negociation.docx" 
    },
    { 
        id: 4, 
        name: "Modèle Personnalisé", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_custom.docx" 
    },
    { 
        id: 5, 
        name: "Modèle Circulaire", 
        type: "word", 
        size: "DOCX", 
        url: "/templates/template_circulaire.docx" 
    },
];

const MainContent: React.FC<MainContentProps> = ({ news, loading, refreshing, error, onRetry }) => {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { addToast } = useToast();
  const { toggleBookmark, isBookmarked, addMultipleBookmarks } = useBookmarks();
  const { isSuperAdmin } = usePermissions();
  const { user } = useAuth();
  
  // Vérification explicite : le rôle actuel peut-il gérer les documents ?
  // super_admin, secretary_general et secretary peuvent gérer les documents
  // Seul secretary_federal est restreint
  const canManageDocuments = !RESTRICTED_ROLES.includes(user?.role || '');
  
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', file_url: '', file_type: 'word', file_size: '', category: 'Modèles', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [uploading, setUploading] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'size'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  
  // Rôles admin pour la gestion des fichiers
  const isAdminRole = ['secretary_general', 'super_admin'].includes(user?.role || '');
  
  // Stockage
  const [storageUsed, setStorageUsed] = useState(0);
  const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB en bytes
  const STORAGE_WARNING_THRESHOLD = 0.8; // 80%

  // Charger les documents partagés et calculer le stockage
  useEffect(() => {
    fetchSharedDocuments();
    fetchStorageUsage();
  }, []);

  const fetchStorageUsage = async () => {
    try {
      // Récupérer la taille totale des fichiers depuis le bucket
      const { data: files, error } = await supabase.storage.from('shared-documents').list('', { limit: 1000 });
      if (!error && files) {
        // Calculer la taille approximative depuis les métadonnées des documents
        const { data: docs } = await supabase.from('shared_documents').select('file_size');
        if (docs) {
          let totalBytes = 0;
          docs.forEach(doc => {
            const sizeStr = doc.file_size?.toLowerCase() || '';
            const match = sizeStr.match(/([\\d.]+)\\s*(kb|mb|gb|ko|mo|go)/i);
            if (match) {
              const value = parseFloat(match[1]);
              const unit = match[2].toLowerCase();
              if (unit === 'kb' || unit === 'ko') totalBytes += value * 1024;
              else if (unit === 'mb' || unit === 'mo') totalBytes += value * 1024 * 1024;
              else if (unit === 'gb' || unit === 'go') totalBytes += value * 1024 * 1024 * 1024;
            }
          });
          setStorageUsed(totalBytes);
        }
      }
    } catch (e) {
      console.error('Erreur calcul stockage:', e);
    }
  };

  const fetchSharedDocuments = async () => {
    const { data, error } = await supabase
      .from('shared_documents')
      .select('*, users:uploaded_by(name, email)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur chargement documents:', error);
    } else {
      // Mapper les données pour inclure le nom du créateur
      const docsWithCreator = (data || []).map(doc => ({
        ...doc,
        created_by_name: doc.users?.name || doc.users?.email?.split('@')[0] || 'Inconnu'
      }));
      setSharedDocuments(docsWithCreator);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-remplir les champs
      if (!newDoc.name) {
        setNewDoc(prev => ({ ...prev, name: file.name }));
      }
      
      // Détecter le type de fichier
      const ext = file.name.split('.').pop()?.toLowerCase();
      let fileType = 'other';
      if (['doc', 'docx'].includes(ext || '')) fileType = 'word';
      else if (['xls', 'xlsx'].includes(ext || '')) fileType = 'excel';
      else if (ext === 'pdf') fileType = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) fileType = 'image';
      else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext || '')) fileType = 'video';
      else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')) fileType = 'audio';
      
      // Calculer la taille
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeMB} MB`;
      
      setNewDoc(prev => ({ 
        ...prev, 
        file_type: fileType,
        file_size: `${sizeStr} • ${ext?.toUpperCase()}` 
      }));
    }
  };

  const handleAddDocument = async () => {
    if (!newDoc.name || (uploadMode === 'url' && !newDoc.file_url) || (uploadMode === 'file' && !selectedFile)) {
      addToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setUploading(true);
    let fileUrl = newDoc.file_url;

    try {
      // Si mode fichier, uploader vers Supabase Storage
      if (uploadMode === 'file' && selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shared-documents')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          addToast('Erreur lors de l\'upload du fichier', 'error');
          console.error(uploadError);
          setUploading(false);
          return;
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('shared-documents')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('shared_documents')
        .insert([{
          name: newDoc.name,
          file_url: fileUrl,
          file_type: newDoc.file_type,
          file_size: newDoc.file_size,
          category: newDoc.category,
          description: newDoc.description,
          uploaded_by: userData.user?.id
        }]);

      if (error) {
        addToast('Erreur lors de l\'ajout du document', 'error');
        console.error(error);
      } else {
        addToast('Document ajouté avec succès', 'success');
        setShowAddDocModal(false);
        setNewDoc({ name: '', file_url: '', file_type: 'word', file_size: '', category: 'Modèles', description: '' });
        setSelectedFile(null);
        fetchSharedDocuments();
      }
    } catch (error) {
      console.error('Erreur:', error);
      addToast('Erreur inattendue', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) return;

    const { error } = await supabase
      .from('shared_documents')
      .delete()
      .eq('id', id);

    if (error) {
      addToast('Erreur lors de la suppression', 'error');
      console.error(error);
    } else {
      addToast('Document supprimé', 'success');
      fetchSharedDocuments();
    }
  };

  // Fonction pour obtenir l'icône et la couleur selon le type de fichier
  const getFileIcon = (fileType: string) => {
    const icons: { [key: string]: { icon: any; color: string } } = {
      'word': { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' },
      'excel': { icon: FileSpreadsheet, color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300' },
      'pdf': { icon: FileText, color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300' },
      'image': { icon: Image, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' },
      'video': { icon: Film, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300' },
      'audio': { icon: Film, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' },
      'other': { icon: File, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300' }
    };
    return icons[fileType] || icons['other'];
  };

  // Types de fichiers disponibles pour le filtre
  const fileTypes = [
    { value: 'all', label: 'Tous types' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
    { value: 'pdf', label: 'PDF' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Vidéos' },
    { value: 'audio', label: 'Audio' },
    { value: 'other', label: 'Autres' }
  ];

  // Filtres de date
  const dateFilters = [
    { value: 'all', label: 'Toutes dates' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' }
  ];

  // Fonction de parsing de taille pour le tri
  const parseFileSize = (sizeStr: string): number => {
    const match = sizeStr?.toLowerCase().match(/([\\d.]+)\\s*(kb|mb|gb|ko|mo|go)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'kb' || unit === 'ko') return value * 1024;
    if (unit === 'mb' || unit === 'mo') return value * 1024 * 1024;
    if (unit === 'gb' || unit === 'go') return value * 1024 * 1024 * 1024;
    return value;
  };

  // Filtrer par date
  const isInDateRange = (dateStr: string, filter: string): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    switch (filter) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'year':
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  // Filtrer et trier les documents
  const filteredAndSortedDocs = sharedDocuments
    .filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(searchDoc.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchDoc.toLowerCase()) ||
                         doc.created_by_name?.toLowerCase().includes(searchDoc.toLowerCase());
      const matchCategory = filterCategory === 'all' || doc.category === filterCategory;
      const matchType = filterType === 'all' || doc.file_type === filterType;
      const matchDate = filterDate === 'all' || isInDateRange(doc.created_at, filterDate);
      return matchSearch && matchCategory && matchType && matchDate;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortBy === 'name') result = a.name.localeCompare(b.name);
      else if (sortBy === 'type') result = a.file_type.localeCompare(b.file_type);
      else if (sortBy === 'date') result = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      else if (sortBy === 'size') result = parseFileSize(b.file_size) - parseFileSize(a.file_size);
      return sortDirection === 'asc' ? -result : result;
    });

  // Filtrer les templates statiques par recherche
  const filteredTemplates = templates.filter(template => {
    if (!searchDoc) return true;
    const matchSearch = template.name.toLowerCase().includes(searchDoc.toLowerCase()) ||
                       template.type.toLowerCase().includes(searchDoc.toLowerCase()) ||
                       template.size.toLowerCase().includes(searchDoc.toLowerCase());
    // Si un filtre de type est actif, vérifier aussi le type
    const matchType = filterType === 'all' || template.type === filterType;
    return matchSearch && matchType;
  });

  // Regrouper tous les documents par type pour l'affichage
  const groupDocumentsByType = () => {
    const groups: { [key: string]: { templates: typeof filteredTemplates, shared: typeof filteredAndSortedDocs } } = {};
    
    // Types disponibles avec leurs labels et ordre
    const typeConfig: { [key: string]: { label: string, order: number } } = {
      'word': { label: 'Documents Word', order: 1 },
      'excel': { label: 'Tableurs Excel', order: 2 },
      'pdf': { label: 'Documents PDF', order: 3 },
      'image': { label: 'Images', order: 4 },
      'video': { label: 'Vidéos', order: 5 },
      'audio': { label: 'Audio', order: 6 },
      'other': { label: 'Autres fichiers', order: 7 },
    };
    
    // Grouper les templates
    filteredTemplates.forEach(template => {
      const type = template.type;
      if (!groups[type]) {
        groups[type] = { templates: [], shared: [] };
      }
      groups[type].templates.push(template);
    });
    
    // Grouper les documents partagés
    filteredAndSortedDocs.forEach(doc => {
      const type = doc.file_type;
      if (!groups[type]) {
        groups[type] = { templates: [], shared: [] };
      }
      groups[type].shared.push(doc);
    });
    
    // Trier et retourner
    return Object.entries(groups)
      .sort(([a], [b]) => (typeConfig[a]?.order || 99) - (typeConfig[b]?.order || 99))
      .map(([type, docs]) => ({
        type,
        label: typeConfig[type]?.label || type.toUpperCase(),
        templates: docs.templates,
        shared: docs.shared,
        count: docs.templates.length + docs.shared.length
      }));
  };

  const documentGroups = groupDocumentsByType();

  // Récupérer les catégories uniques
  const categories = Array.from(new Set(sharedDocuments.map(d => d.category)));

  // Créateurs uniques
  const creators = Array.from(new Set(sharedDocuments.map(d => d.created_by_name).filter(Boolean)));

  // Calcul du pourcentage de stockage
  const storagePercent = (storageUsed / STORAGE_LIMIT) * 100;
  const storageWarning = storagePercent >= STORAGE_WARNING_THRESHOLD * 100;
  const storageFull = storagePercent >= 95;

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDownload = (name: string) => {
    addToast(`Téléchargement de "${name}" lancé...`, 'success');
  };

  const sortedNews = [...news].sort((a, b) => {
    const dateA = parseFrenchDate(a.date);
    const dateB = parseFrenchDate(b.date);
    return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-8">
      
      {/* Section Actions Rapides */}
      <Card>
        <CardHeader 
            title="Outils Rapides" 
            subtitle="Accès direct à vos applications métiers"
            action={
                <Tooltip content="Applications principales">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full cursor-help"><Zap className="w-5 h-5 text-blue-600 dark:text-blue-400"/></div>
                </Tooltip>
            }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Action 1 */}
            <a href={DOCEASE_URL} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[24px] p-6 text-white hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
                    <FileText className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">DocEase : Générateur de Lettres</h3>
                        <p className="text-purple-100 text-sm font-medium opacity-90">Vos modèles de lettre à générer</p>
                    </div>
                </div>
            </a>

             {/* Action 2 */}
            <a href={`${SIGNEASE_URL}/#/dashboard`} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-gradient-to-br from-rose-500 to-orange-600 rounded-[24px] p-6 text-white hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
                    <Edit3 className="w-32 h-32 -rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                         <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">SignEase : Signature Électronique</h3>
                        <p className="text-rose-100 text-sm font-medium opacity-90">Signer vos PDF en ligne</p>
                    </div>
                </div>
            </a>
        </div>
      </Card>

      {/* Section Modèles & Documents */}
      <Card>
        <CardHeader 
            title="Modèles & Documents" 
            subtitle="Fichiers de référence à télécharger"
            action={
              <div className="flex items-center gap-2">
                {/* Indicateur de stockage (visible pour super_admin) */}
                {isSuperAdmin && (
                  <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <HardDrive className={`w-4 h-4 ${storageFull ? 'text-red-500' : storageWarning ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`} />
                    <div className="flex flex-col">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${storageFull ? 'bg-red-500' : storageWarning ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(storagePercent, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[9px] ${storageFull ? 'text-red-500' : storageWarning ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatStorageSize(storageUsed)} / 1 GB
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Mode d'affichage */}
                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700 rounded-full p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    title="Vue grille"
                  >
                    <Grid className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    title="Vue liste"
                  >
                    <List className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
                
                {/* Bouton filtres avancés - icône seule */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-full transition-colors ${
                    showFilters || filterType !== 'all' || filterDate !== 'all'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                  title="Filtres avancés"
                >
                  <Filter className="w-4 h-4" />
                </button>
                
                {/* Bouton gestion des fichiers - uniquement pour admins */}
                {isAdminRole && (
                  <button
                    onClick={() => setShowManagementPanel(true)}
                    className="p-2 rounded-full bg-[#a84383] text-white hover:bg-[#8c366c] dark:bg-[#dd60b0] dark:hover:bg-[#c050a0] transition-colors"
                    title="Gérer les fichiers (suppression)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
                
                {/* Seul super_admin peut ajouter (pas secretary/secretary_federal) */}
                {canManageDocuments && (
                  <button
                    onClick={() => {
                      if (storageFull) {
                        addToast('Stockage plein ! Supprimez des fichiers avant d\'en ajouter.', 'error');
                        return;
                      }
                      setShowAddDocModal(true);
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      storageFull 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                    }`}
                    title="Ajouter un document"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            }
        />
        
        {/* Alerte stockage */}
        {canManageDocuments && (storageWarning || storageFull) && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
            storageFull 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${storageFull ? 'text-red-500' : 'text-amber-500'}`} />
            <div>
              <p className={`text-sm font-semibold ${storageFull ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {storageFull ? 'Stockage plein !' : 'Stockage presque plein'}
              </p>
              <p className={`text-xs ${storageFull ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                {storageFull 
                  ? 'Vous devez supprimer des fichiers pour pouvoir en ajouter de nouveaux.'
                  : `Vous utilisez ${storagePercent.toFixed(0)}% de votre espace de stockage. Pensez à faire le ménage.`
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Barre de recherche et filtres */}
        {(templates.length > 0 || sharedDocuments.length > 0) && (
          <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  placeholder="Rechercher par nom, description..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              
              {/* Filtre par catégorie */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
              
              {/* Tri */}
              <div className="flex items-center gap-1">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'type' | 'size')}
                    className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="date">Date</option>
                    <option value="name">Nom</option>
                    <option value="type">Type</option>
                    <option value="size">Taille</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title={sortDirection === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Filtres avancés */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                {/* Filtre par type */}
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {fileTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Filtre par date */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {dateFilters.map(df => (
                      <option key={df.value} value={df.value}>{df.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Bouton réinitialiser */}
                {(filterType !== 'all' || filterDate !== 'all' || filterCategory !== 'all' || searchDoc) && (
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterDate('all');
                      setFilterCategory('all');
                      setSearchDoc('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Réinitialiser
                  </button>
                )}
                
                {/* Compteur de résultats */}
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 self-center">
                  {filteredAndSortedDocs.length + filteredTemplates.length} résultat(s)
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-6">
          {documentGroups.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucun document trouvé</p>
            </div>
          ) : (
            documentGroups.map((group) => {
              const { icon: GroupIcon, color: groupColor } = getFileIcon(group.type);
              return (
                <div key={group.type} className="space-y-2">
                  {/* En-tête du groupe */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${groupColor}`}>
                      <GroupIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.label}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                      {group.count}
                    </span>
                  </div>
                  
                  {/* Documents du groupe */}
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-2'}>
                    {/* Templates statiques */}
                    {group.templates.map((template) => {
                      const isStarred = isBookmarked(template.id);
                      return (
                        <div 
                          key={`template-${template.id}`} 
                          className="flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all group"
                        >
                          <a 
                            href={template.url} 
                            download
                            onClick={() => handleDownload(template.name)}
                            className="flex items-center flex-1 min-w-0 cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${template.type === 'word' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300'}`}>
                              {template.type === 'word' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-8">{template.name}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wide">{template.size}</p>
                            </div>
                          </a>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleBookmark({
                                  id: template.id,
                                  type: 'template',
                                  title: template.name,
                                  url: template.url,
                                  subtitle: template.size
                                });
                              }}
                              className="p-2 text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors"
                              title="Ajouter aux favoris"
                            >
                              <Star className={`w-4 h-4 transition-transform active:scale-125 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            <a 
                              href={template.url}
                              download
                              onClick={() => handleDownload(template.name)}
                              className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Documents partagés Supabase */}
                    {group.shared.map((doc) => {
                      const isStarred = isBookmarked(`shared-${doc.id}`);
                      const { icon: Icon, color } = getFileIcon(doc.file_type);
                      return (
                        <div 
                          key={`shared-${doc.id}`} 
                          className="flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all group"
                        >
                          <a 
                            href={doc.file_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleDownload(doc.name)}
                            className="flex items-center flex-1 min-w-0 cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.name}</p>
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex-shrink-0">{doc.category}</span>
                              </div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wide">{doc.file_size}</p>
                              {viewMode === 'list' && doc.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{doc.description}</p>
                              )}
                            </div>
                          </a>
                          {viewMode === 'list' && doc.created_by_name && (
                            <div className="hidden sm:flex items-center gap-2 mr-2 text-xs text-slate-400 dark:text-slate-500">
                              <User className="w-3 h-3" />
                              <span>{doc.created_by_name}</span>
                              <span>•</span>
                              <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleBookmark({
                                  id: `shared-${doc.id}`,
                                  type: 'template',
                                  title: doc.name,
                                  url: doc.file_url,
                                  subtitle: doc.file_size
                                });
                              }}
                              className="p-2 text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors"
                              title="Ajouter aux favoris"
                            >
                              <Star className={`w-4 h-4 transition-transform active:scale-125 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            {canManageDocuments && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteDocument(doc.id, doc.name);
                                }}
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <a 
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleDownload(doc.name)}
                              className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Modal d'ajout de document */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ajouter un document</h3>
              <button onClick={() => setShowAddDocModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Mode sélection */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  📁 Uploader un fichier
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'url'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🔗 Lien URL
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du document *</label>
                <input
                  type="text"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Modèle de contrat"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Description courte du document"
                  rows={2}
                />
              </div>
              
              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fichier *</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                      accept=".doc,.docx,.xls,.xlsx,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.ogg,.zip,.rar"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ {selectedFile.name} sélectionné ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Types acceptés: Documents, Images, Vidéos, Audio (max recommandé: 50 MB)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL du fichier *</label>
                  <input
                    type="url"
                    value={newDoc.file_url}
                    onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemple.com/document.docx"
                    required
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de fichier</label>
                  <div className="relative">
                    <select
                      value={newDoc.file_type}
                      onChange={(e) => setNewDoc({ ...newDoc, file_type: e.target.value })}
                      className="appearance-none w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="word">📄 Word</option>
                      <option value="excel">📊 Excel</option>
                      <option value="pdf">📕 PDF</option>
                      <option value="image">🖼️ Image</option>
                      <option value="video">🎬 Vidéo</option>
                      <option value="audio">🎵 Audio</option>
                      <option value="other">📁 Autre</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                  <div className="relative">
                    <select
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                      className="appearance-none w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="Modèles">Modèles</option>
                      <option value="Formulaires">Formulaires</option>
                      <option value="Guides">Guides</option>
                      <option value="Références">Références</option>
                      <option value="Juridique">Juridique</option>
                      <option value="Formation">Formation</option>
                      <option value="Autre">Autre</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Taille</label>
                <input
                  type="text"
                  value={newDoc.file_size}
                  onChange={(e) => setNewDoc({ ...newDoc, file_size: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 2.5 MB, DOCX"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddDocModal(false);
                  setSelectedFile(null);
                  setNewDoc({ name: '', file_url: '', file_type: 'word', file_size: '', category: 'Modèles', description: '' });
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleAddDocument}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Upload...
                  </>
                ) : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actualités */}
      <Card>
        <CardHeader 
            title="Dernières actualités" 
            subtitle={
                <a href="https://www.fo-metaux.fr/actualite/c/0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                    Source: fo-metaux.fr
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    {refreshing && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>}
                </a>
            }
            action={
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                    <Tooltip content="Plus récents">
                     <button onClick={() => setSortOrder('newest')} className={`p-1.5 rounded-full transition-all ${sortOrder === 'newest' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <ArrowDown className="w-4 h-4" />
                     </button>
                    </Tooltip>
                    <Tooltip content="Plus anciens">
                     <button onClick={() => setSortOrder('oldest')} className={`p-1.5 rounded-full transition-all ${sortOrder === 'oldest' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <ArrowUp className="w-4 h-4" />
                     </button>
                    </Tooltip>
                </div>
            }
        />

        {loading ? (
            <NewsSkeleton />
          ) : error ? (
            <div className="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 mx-4 mb-4">
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 animate-bounce">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-red-900 dark:text-red-200 font-bold mb-1">Erreur de chargement</h3>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4 px-4">{error}</p>
                <button 
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 transition-all text-sm shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Réessayer
                </button>
            </div>
          ) : sortedNews.length > 0 ? (
            <div className="space-y-2">
              {sortedNews.map((newsItem) => {
                const isStarred = isBookmarked(newsItem.id);
                return (
                <div key={newsItem.id} className="group flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 relative">
                  {/* Icon Placeholder based on category */}
                  <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="hidden sm:flex flex-shrink-0 w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Newspaper className="w-6 h-6" />
                  </a>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <Badge variant="blue" size="sm">{newsItem.category}</Badge>
                      {isNewsRecent(newsItem.date) && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Nouveau
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {newsItem.date}
                      </span>
                    </div>
                    <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2 pr-8">
                        {newsItem.title}
                    </a>
                  </div>

                  <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={(e) => {
                            e.preventDefault();
                            toggleBookmark({
                                id: newsItem.id,
                                type: 'news',
                                title: newsItem.title,
                                url: newsItem.url,
                                subtitle: newsItem.date
                            });
                        }}
                        className="text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors"
                      >
                         <Star className={`w-4 h-4 transition-transform active:scale-125 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                      </a>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
              <Newspaper className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3"/>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune actualité disponible</p>
            </div>
          )}

          {!loading && !error && (
             <a href="https://www.fo-metaux.fr/actualite/c/0" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-center w-full py-3.5 bg-fo-dark dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95">
              Voir toutes les actualités
            </a>
          )}
      </Card>

      {/* Panel de gestion des documents (pour admins) */}
      <DocumentsManagementPanel 
        isOpen={showManagementPanel} 
        onClose={() => {
          setShowManagementPanel(false);
          // Rafraîchir les documents après fermeture du panel
          fetchSharedDocuments();
          fetchStorageUsage();
        }} 
      />
    </div>
  );
};

export default MainContent;