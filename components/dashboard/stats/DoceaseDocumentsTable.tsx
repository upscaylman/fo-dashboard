import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Calendar, User, Users, Filter, Search, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, CheckCircle, AlertCircle, Eye, X, RotateCcw, List } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { DOCEASE_URL } from '../../../constants';

// Rôles qui ne voient que leurs propres données
const RESTRICTED_ROLES = ['secretary', 'secretary_federal'];
// Rôles administrateurs avec accès complet et filtrage avancé
const ADMIN_ROLES = ['secretary_general', 'super_admin'];

interface DoceaseDocument {
  id: number;
  user_id: string | null;
  document_type: string;
  title: string;
  file_url: string | null;
  metadata: {
    format?: string;
    action?: string;
    [key: string]: any;
  };
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    avatar_url?: string;
  };
}

const DoceaseDocumentsTable: React.FC = () => {
  const [documents, setDocuments] = useState<DoceaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = plus récent en premier
  const [showInfoBanner, setShowInfoBanner] = useState(true); // État pour masquer le bandeau

  // Récupérer le contexte d'authentification pour filtrer les données
  const { user } = useAuth();
  const effectiveRole = user?.role || 'secretary';
  const isRestrictedView = !ADMIN_ROLES.includes(effectiveRole);
  
  // État pour le filtre par utilisateur (uniquement pour les admins)
  const [filterUser, setFilterUser] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();

    // Realtime subscription pour mise à jour automatique
    const channel = supabase
      .channel('docease_documents_table')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'docease_documents'
        },
        () => {
          console.log('🔄 Document DocEase changé, rechargement...');
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isRestrictedView, user?.id]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('docease_documents')
        .select(`
          *,
          user:users(name, email, avatar, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Filtrer par user_id si rôle restreint
      if (isRestrictedView && user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur chargement documents DocEase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (doc: DoceaseDocument) => {
    try {
      // Si le document a une URL de fichier (colonne file_url ou dans métadonnées), on la télécharge directement
      const fileUrl = doc.file_url || doc.metadata?.file_url;
      if (fileUrl) {
        // Télécharger directement le fichier depuis Supabase Storage
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = doc.title;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Si pas d'URL, afficher un message d'information
      const shouldOpenDocease = window.confirm(
        `📄 Le fichier "${doc.title}" n'est pas encore stocké sur le serveur.\n\n` +
        `Ce document a été envoyé par email mais n'a pas été sauvegardé dans le cloud.\n\n` +
        `Voulez-vous ouvrir DocEase pour régénérer ce document ?`
      );

      if (shouldOpenDocease) {
        // Ouvrir DocEase dans un nouvel onglet
        window.open(DOCEASE_URL, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('❌ Erreur lors du téléchargement du document. Veuillez réessayer.');
    }
  };

  // Vérifier si un document a un fichier téléchargeable
  const hasDownloadableFile = (doc: DoceaseDocument): boolean => {
    return !!(doc.file_url || doc.metadata?.file_url);
  };

  // Filtrage des documents
  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      const searchLower = searchTerm.toLowerCase();
      // Gérer le cas où user peut être un tableau ou un objet
      const userName = Array.isArray(doc.user) ? doc.user[0]?.name : doc.user?.name;
      const userEmail = Array.isArray(doc.user) ? doc.user[0]?.email : doc.user?.email;
      
      const matchSearch = searchTerm === '' || 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.document_type.toLowerCase().includes(searchLower) ||
        userName?.toLowerCase().includes(searchLower) ||
        userEmail?.toLowerCase().includes(searchLower) ||
        doc.metadata?.emailDelegue?.toLowerCase().includes(searchLower) ||
        doc.metadata?.destinataire?.toLowerCase().includes(searchLower);

      const matchType = filterType === 'all' || doc.document_type === filterType;
      const matchFormat = filterFormat === 'all' || doc.metadata?.format === filterFormat;
      const matchUser = filterUser === 'all' || doc.user_id === filterUser;

      return matchSearch && matchType && matchFormat && matchUser;
    });

    // Tri par date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [documents, searchTerm, filterType, filterFormat, filterUser, sortOrder]);

  // Helper pour obtenir les infos utilisateur (gère le cas tableau/objet)
  const getUserInfo = (doc: DoceaseDocument) => {
    const user = Array.isArray(doc.user) ? doc.user[0] : doc.user;
    return {
      name: user?.name || 'Utilisateur inconnu',
      email: user?.email || 'N/A',
      initial: user?.name?.[0]?.toUpperCase() || '?',
      avatar: user?.avatar || user?.avatar_url
    };
  };

  // Fonction pour basculer l'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Extraction des types et formats uniques
  const documentTypes = Array.from(new Set(documents.map(d => d.document_type)));
  const documentFormats = Array.from(new Set(documents.map(d => d.metadata?.format).filter(Boolean)));
  
  // Extraction des utilisateurs uniques pour le filtre admin
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map<string, { id: string; name: string; email: string }>();
    documents.forEach(doc => {
      if (doc.user_id) {
        const userInfo = getUserInfo(doc);
        if (!usersMap.has(doc.user_id)) {
          usersMap.set(doc.user_id, {
            id: doc.user_id,
            name: userInfo.name,
            email: userInfo.email
          });
        }
      }
    });
    return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFormatBadgeColor = (format?: string) => {
    switch (format) {
      case 'docx': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/50';
      case 'pdf': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bandeau d'information */}
      {showInfoBanner && (
        <div className="bg-[#ffd8ec] dark:bg-[#a84383]/20 border border-[#dd60b0] dark:border-[#a84383]/50 rounded-xl p-4 relative">
          <button
            onClick={() => setShowInfoBanner(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#dd60b0]/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-[#a84383] dark:text-[#dd60b0]" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <Download className="w-5 h-5 text-[#a84383] dark:text-[#dd60b0] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#a84383] dark:text-[#dd60b0] mb-1">
                Téléchargement des documents
              </h4>
              <p className="text-sm text-[#a64182] dark:text-[#dd60b0]/80">
                Les documents avec l'icône <CheckCircle className="w-4 h-4 inline-block text-green-500" /> sont disponibles au téléchargement direct.
                Les documents avec l'icône <AlertCircle className="w-4 h-4 inline-block text-amber-500" /> ont été envoyés par email mais ne sont pas stockés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par titre, utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#a84383] dark:focus:ring-[#dd60b0]"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Filtre par utilisateur (uniquement pour les admins) */}
          {!isRestrictedView && (
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="appearance-none cursor-pointer pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a84383] dark:focus:ring-[#dd60b0]"
              >
                <option value="all">Tous les utilisateurs</option>
                {uniqueUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <List className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none cursor-pointer pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a84383] dark:focus:ring-[#dd60b0]"
            >
              <option value="all">Tous les types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="appearance-none cursor-pointer pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a84383] dark:focus:ring-[#dd60b0]"
            >
              <option value="all">Tous les formats</option>
              {documentFormats.map(format => (
                <option key={format} value={format}>{format?.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Bouton de réinitialisation des filtres */}
          {(filterType !== 'all' || filterFormat !== 'all' || filterUser !== 'all' || searchTerm !== '') && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterFormat('all');
                setFilterUser('all');
                setSearchTerm('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300 transition-colors"
              title="Réinitialiser les filtres"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{filteredDocuments.length}</div>
          <div className="text-sm text-purple-600 dark:text-purple-500">Documents total</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {filteredDocuments.filter(d => hasDownloadableFile(d)).length}
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-sm text-green-600 dark:text-green-500">Téléchargeables</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {filteredDocuments.filter(d => d.metadata?.format === 'docx').length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-500">Fichiers DOCX</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {filteredDocuments.filter(d => d.metadata?.format === 'pdf').length}
          </div>
          <div className="text-sm text-red-600 dark:text-red-500">Fichiers PDF</div>
        </div>
      </div>

      {/* Tableau des documents */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors select-none"
                  onClick={toggleSortOrder}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {sortOrder === 'desc' ? (
                      <ArrowDown className="w-4 h-4 text-[#a84383]" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-[#a84383]" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium mb-1">Aucun document DocEase</p>
                    <p className="text-sm">Les documents générés apparaîtront ici automatiquement.</p>
                    <a 
                      href={DOCEASE_URL}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#a84383] text-white rounded-full text-sm font-medium hover:bg-[#8f366e] transition-colors"
                    >
                      Ouvrir DocEase
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#ffd8ec] dark:bg-[#a84383]/30 rounded-lg">
                          <FileText className="w-4 h-4 text-[#a84383] dark:text-[#dd60b0]" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                            {doc.title}
                            {hasDownloadableFile(doc) ? (
                              <span title="Fichier disponible au téléchargement">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </span>
                            ) : (
                              <span title="Fichier non stocké - envoyé par email uniquement">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">ID: {doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getFormatBadgeColor(doc.metadata?.format)}`}>
                        {doc.metadata?.format?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getUserInfo(doc).avatar ? (
                          <img 
                            src={getUserInfo(doc).avatar} 
                            alt={getUserInfo(doc).name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-[#dd60b0] to-[#a84383] rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {getUserInfo(doc).initial}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {getUserInfo(doc).name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {getUserInfo(doc).email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {formatDate(doc.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Bouton Télécharger */}
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className={`group relative p-2 rounded-lg transition-all duration-200 ${
                            hasDownloadableFile(doc)
                              ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                              : 'text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                          title={hasDownloadableFile(doc) ? 'Télécharger le fichier' : 'Fichier non disponible - Ouvrir DocEase'}
                        >
                          <Download className="w-5 h-5" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {hasDownloadableFile(doc) ? 'Télécharger' : 'Régénérer'}
                          </span>
                        </button>
                        
                        {/* Bouton Voir le fichier (seulement si disponible) */}
                        {hasDownloadableFile(doc) && (
                          <a
                            href={doc.file_url || doc.metadata?.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                            title="Voir le fichier"
                          >
                            <Eye className="w-5 h-5" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Voir
                            </span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer avec total */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Affichage de <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredDocuments.length}</span> sur <span className="font-semibold text-slate-700 dark:text-slate-300">{documents.length}</span> documents
      </div>
    </div>
  );
};

export default DoceaseDocumentsTable;
