import React, { useState, useEffect } from 'react';
import { 
  FileText, FileSpreadsheet, File, Image, Film, Download, Trash2, 
  Search, Filter, ChevronDown, AlertCircle, CheckCircle, X, 
  Calendar, User, HardDrive, Plus, Upload, ExternalLink, RotateCcw,
  Grid, List, Settings, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Rôles administrateurs pouvant gérer les fichiers
const ADMIN_ROLES = ['secretary_general', 'super_admin'];

// Templates statiques (fichiers de référence intégrés au projet)
const STATIC_TEMPLATES = [
  { 
    id: 'static-1', 
    name: "Liste Globale Destinataires", 
    file_type: "excel", 
    file_size: "Macro XLSM", 
    file_url: "/templates/LISTE GLOBALE DESTINATAIRES-REORGANISE.xlsm",
    category: "Tableurs Excel",
    isStatic: true
  },
  { 
    id: 'static-2', 
    name: "Modèle Désignation", 
    file_type: "word", 
    file_size: "DOCX", 
    file_url: "/templates/template_designation.docx",
    category: "Documents Word",
    isStatic: true
  },
  { 
    id: 'static-3', 
    name: "Modèle Négociation", 
    file_type: "word", 
    file_size: "DOCX", 
    file_url: "/templates/template_negociation.docx",
    category: "Documents Word",
    isStatic: true
  },
  { 
    id: 'static-4', 
    name: "Modèle Personnalisé", 
    file_type: "word", 
    file_size: "DOCX", 
    file_url: "/templates/template_custom.docx",
    category: "Documents Word",
    isStatic: true
  },
  { 
    id: 'static-5', 
    name: "Modèle Circulaire", 
    file_type: "word", 
    file_size: "DOCX", 
    file_url: "/templates/template_circulaire.docx",
    category: "Documents Word",
    isStatic: true
  },
];

interface SharedDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: string;
  category: string;
  description?: string;
  created_at?: string;
  created_by?: string;
  created_by_name?: string;
  isStatic?: boolean;
}

interface DocumentsManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentsManagementPanel: React.FC<DocumentsManagementPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const effectiveRole = user?.role || 'secretary';
  const isAdmin = ADMIN_ROLES.includes(effectiveRole);

  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);

  const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchDocuments();
      fetchStorageUsage();
    }
  }, [isOpen, isAdmin]);

  // Subscription temps réel pour mise à jour automatique
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('management-panel-documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_documents' },
        (payload) => {
          console.log('📁 [ManagementPanel] Document change:', payload.eventType);
          fetchDocuments();
          fetchStorageUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Requête simple sans jointure de clé étrangère
      const { data, error } = await supabase
        .from('shared_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedDocs: SharedDocument[] = (data || []).map(doc => ({
        ...doc,
        created_by_name: doc.created_by_name || 'Inconnu',
        isStatic: false
      }));
      
      // Combiner les templates statiques avec les documents partagés
      const allDocuments = [...STATIC_TEMPLATES, ...formattedDocs];
      
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      addToast('Erreur lors du chargement des documents', 'error');
      // En cas d'erreur, afficher au moins les templates statiques
      setDocuments([...STATIC_TEMPLATES]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const { data: files } = await supabase.storage.from('shared-documents').list('', { limit: 1000 });
      if (files) {
        // Note: Supabase ne retourne pas la taille directement, on utilise les métadonnées
        const { data: docs } = await supabase.from('shared_documents').select('file_size');
        if (docs) {
          const totalSize = docs.reduce((acc, doc) => {
            const size = parseFloat(doc.file_size || '0');
            const unit = doc.file_size?.toLowerCase() || '';
            if (unit.includes('kb')) return acc + size * 1024;
            if (unit.includes('mb')) return acc + size * 1024 * 1024;
            if (unit.includes('gb')) return acc + size * 1024 * 1024 * 1024;
            return acc + size;
          }, 0);
          setStorageUsed(totalSize);
        }
      }
    } catch (error) {
      console.error('Erreur calcul stockage:', error);
    }
  };

  const handleDeleteDocument = async (doc: SharedDocument) => {
    if (!confirm(`Voulez-vous vraiment supprimer "${doc.name}" ?\n\nCette action est irréversible.`)) return;

    try {
      setDeleting(true);
      
      // Supprimer le fichier du storage si c'est une URL Supabase
      if (doc.file_url.includes('supabase')) {
        const path = doc.file_url.split('/shared-documents/')[1];
        if (path) {
          await supabase.storage.from('shared-documents').remove([path]);
        }
      }

      // Supprimer l'entrée de la base de données
      const { error } = await supabase
        .from('shared_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      addToast(`"${doc.name}" supprimé avec succès`, 'success');
      fetchDocuments();
      fetchStorageUsage();
    } catch (error) {
      console.error('Erreur suppression:', error);
      addToast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    
    if (!confirm(`Voulez-vous vraiment supprimer ${selectedDocs.size} document(s) ?\n\nCette action est irréversible.`)) return;

    try {
      setDeleting(true);
      
      for (const docId of selectedDocs) {
        const doc = documents.find(d => d.id === docId);
        if (!doc) continue;

        // Supprimer du storage si applicable
        if (doc.file_url.includes('supabase')) {
          const path = doc.file_url.split('/shared-documents/')[1];
          if (path) {
            await supabase.storage.from('shared-documents').remove([path]);
          }
        }

        // Supprimer de la base
        await supabase.from('shared_documents').delete().eq('id', docId);
      }

      addToast(`${selectedDocs.size} document(s) supprimé(s)`, 'success');
      setSelectedDocs(new Set());
      fetchDocuments();
      fetchStorageUsage();
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
      addToast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectDoc = (id: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === deletableDocuments.length && deletableDocuments.length > 0) {
      setSelectedDocs(new Set());
    } else {
      // Sélectionner uniquement les documents non-statiques
      setSelectedDocs(new Set(deletableDocuments.map(d => d.id)));
    }
  };

  // Icône selon le type de fichier
  const getFileIcon = (fileType: string) => {
    const icons: { [key: string]: { icon: any; color: string } } = {
      'word': { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' },
      'excel': { icon: FileSpreadsheet, color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300' },
      'pdf': { icon: FileText, color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300' },
      'image': { icon: Image, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' },
      'video': { icon: Film, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300' },
      'other': { icon: File, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300' }
    };
    return icons[fileType] || icons['other'];
  };

  // Filtrage
  const filteredDocuments = documents.filter(doc => {
    const matchSearch = searchTerm === '' ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = filterType === 'all' || doc.file_type === filterType;
    const matchCategory = filterCategory === 'all' || doc.category === filterCategory;

    return matchSearch && matchType && matchCategory;
  });

  // Documents supprimables (non-statiques)
  const deletableDocuments = filteredDocuments.filter(d => !d.isStatic);

  // Catégories uniques
  const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean)));
  
  // Types de fichiers
  const fileTypes = [
    { value: 'all', label: 'Tous types' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
    { value: 'pdf', label: 'PDF' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Vidéos' },
    { value: 'other', label: 'Autres' }
  ];

  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const storagePercent = (storageUsed / STORAGE_LIMIT) * 100;

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Accès refusé</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Seuls les secrétaires généraux et super administrateurs peuvent accéder à cette fonctionnalité.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#a84383] to-[#dd60b0] rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestion des fichiers</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gérer et supprimer les fichiers de référence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Storage info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className={`w-5 h-5 ${storagePercent >= 95 ? 'text-red-500' : storagePercent >= 80 ? 'text-amber-500' : 'text-slate-500'}`} />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Stockage utilisé : <strong>{formatStorageSize(storageUsed)}</strong> / 1 GB
              </span>
            </div>
            {/* Barre de progression avec zone rouge pour les 5% finaux */}
            <div className="w-32 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
              {/* Zone rouge pour les derniers 5% (95-100%) - toujours visible */}
              <div className="absolute right-0 top-0 h-full w-[5%] bg-red-400/50 dark:bg-red-500/30" />
              {/* Barre de progression principale */}
              <div 
                className={`h-full rounded-full transition-all relative z-10 ${
                  storagePercent >= 95 ? 'bg-red-500' : 
                  storagePercent >= 80 ? 'bg-amber-500' : 
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#a84383]"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none cursor-pointer pl-4 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a84383] dark:focus:ring-[#dd60b0] [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-slate-100"
                >
                  {fileTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none cursor-pointer pl-4 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a84383] dark:focus:ring-[#dd60b0] [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-slate-100"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>

              {(filterType !== 'all' || filterCategory !== 'all' || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterCategory('all');
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Actions en masse */}
          {selectedDocs.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <CheckCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400 font-medium">
                {selectedDocs.size} document(s) sélectionné(s)
              </span>
              <div className="flex-1" />
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer la sélection
              </button>
              <button
                onClick={() => setSelectedDocs(new Set())}
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        {/* Liste des documents */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header de sélection */}
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedDocs.size === deletableDocuments.length && deletableDocuments.length > 0}
                  onChange={toggleSelectAll}
                  disabled={deletableDocuments.length === 0}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#a84383] focus:ring-[#a84383] disabled:opacity-50"
                  title={deletableDocuments.length === 0 ? "Aucun document supprimable" : "Sélectionner tous les documents supprimables"}
                />
                <span className="flex-1">Document</span>
                <span className="w-24 text-center hidden sm:block">Type</span>
                <span className="w-24 text-center hidden sm:block">Taille</span>
                <span className="w-32 text-center hidden md:block">Ajouté par</span>
                <span className="w-28 text-center hidden lg:block">Date</span>
                <span className="w-24 text-center">Actions</span>
              </div>

              {filteredDocuments.map(doc => {
                const { icon: Icon, color } = getFileIcon(doc.file_type);
                const isSelected = selectedDocs.has(doc.id);
                const isStaticDoc = doc.isStatic === true;

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      isStaticDoc
                        ? 'bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-800/40 border-slate-200 dark:border-slate-700'
                        : isSelected 
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Checkbox - désactivée pour les fichiers statiques */}
                    {isStaticDoc ? (
                      <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center" title="Fichier intégré - non modifiable">
                        <Lock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                      </div>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDoc(doc.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#a84383] focus:ring-[#a84383]"
                      />
                    )}
                    
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                        {isStaticDoc && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-700/50">
                            <Lock className="w-2.5 h-2.5" />
                            Intégré
                          </span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{doc.description}</p>
                      )}
                      <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                        {doc.category}
                      </span>
                    </div>

                    <span className="w-24 text-center text-xs text-slate-500 dark:text-slate-400 hidden sm:block uppercase">
                      {doc.file_type}
                    </span>

                    <span className="w-24 text-center text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                      {doc.file_size}
                    </span>

                    <span className="w-32 text-center text-xs text-slate-500 dark:text-slate-400 hidden md:block truncate">
                      {isStaticDoc ? (
                        <span className="text-slate-400 dark:text-slate-500 italic">Système</span>
                      ) : (
                        doc.created_by_name || 'Inconnu'
                      )}
                    </span>

                    <span className="w-28 text-center text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
                      {isStaticDoc ? (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      ) : doc.created_at ? (
                        new Date(doc.created_at).toLocaleDateString('fr-FR')
                      ) : '—'}
                    </span>

                    <div className="w-24 flex items-center justify-center gap-1">
                      <a
                        href={doc.file_url}
                        download={doc.name}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {!isStaticDoc && (
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          disabled={deleting}
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {isStaticDoc && (
                        <div className="p-2 text-slate-300 dark:text-slate-600 cursor-not-allowed" title="Les fichiers intégrés ne peuvent pas être supprimés">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>
              {filteredDocuments.length} document(s) affiché(s)
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {filteredDocuments.filter(d => d.isStatic).length} intégré(s)
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>
              {deletableDocuments.length} supprimable(s)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentsManagementPanel;
