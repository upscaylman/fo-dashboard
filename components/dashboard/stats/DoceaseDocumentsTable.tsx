import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Calendar, User, Filter, Search, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface DoceaseDocument {
  id: number;
  user_id: string | null;
  document_type: string;
  title: string;
  file_url: string | null;
  metadata: {
    format?: string;
    [key: string]: any;
  };
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

const DoceaseDocumentsTable: React.FC = () => {
  const [documents, setDocuments] = useState<DoceaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = plus récent en premier

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
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('docease_documents')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

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
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = doc.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Si pas d'URL, afficher un message d'information
      const shouldOpenDocease = window.confirm(
        `⚠️ Le fichier "${doc.title}" n'est pas disponible en téléchargement direct.\n\n` +
        `Les documents DocEase sont générés à la demande et envoyés par email.\n\n` +
        `Voulez-vous ouvrir DocEase pour régénérer ce document ?`
      );

      if (shouldOpenDocease) {
        // Ouvrir DocEase dans un nouvel onglet
        const doceaseUrl = import.meta.env.VITE_DOCEASE_URL || 'http://localhost:3000';
        window.open(doceaseUrl, '_blank');
      } else {
        // Télécharger un fichier JSON avec les informations du document
        const documentData = {
          id: doc.id,
          title: doc.title,
          type: doc.document_type,
          format: doc.metadata?.format || 'docx',
          user: {
            name: doc.user?.name,
            email: doc.user?.email
          },
          created_at: doc.created_at,
          metadata: doc.metadata,
          instructions: [
            "Ce fichier contient les métadonnées du document DocEase.",
            "Pour obtenir le fichier Word original :",
            "1. Ouvrez DocEase (http://localhost:3000)",
            "2. Régénérez le document avec les mêmes paramètres",
            "3. Le document sera envoyé par email pour validation"
          ]
        };

        const blob = new Blob([JSON.stringify(documentData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title.replace(/\.(docx|pdf)$/i, '')}_metadata.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('❌ Erreur lors du téléchargement du document. Veuillez réessayer.');
    }
  };

  // Filtrage des documents
  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      const matchSearch = searchTerm === '' || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || doc.document_type === filterType;
      const matchFormat = filterFormat === 'all' || doc.metadata?.format === filterFormat;

      return matchSearch && matchType && matchFormat;
    });

    // Tri par date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [documents, searchTerm, filterType, filterFormat, sortOrder]);

  // Fonction pour basculer l'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Extraction des types et formats uniques
  const documentTypes = Array.from(new Set(documents.map(d => d.document_type)));
  const documentFormats = Array.from(new Set(documents.map(d => d.metadata?.format).filter(Boolean)));

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
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              📥 Téléchargement des documents
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Les documents DocEase sont générés à la demande et envoyés par email. 
              Cliquez sur <Download className="w-4 h-4 inline-block" /> pour télécharger le fichier s'il est disponible, 
              ou ouvrir DocEase pour régénérer le document.
            </p>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par titre, utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none cursor-pointer pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
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
              className="appearance-none cursor-pointer pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            >
              <option value="all">Tous les formats</option>
              {documentFormats.map(format => (
                <option key={format} value={format}>{format?.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{filteredDocuments.length}</div>
          <div className="text-sm text-purple-600 dark:text-purple-500">Documents affichés</div>
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
                      <ArrowDown className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-blue-500" />
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
                    <p>Aucun document trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {doc.title}
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
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {doc.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {doc.user?.name || 'Utilisateur inconnu'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {doc.user?.email || 'N/A'}
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
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="group relative p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200"
                          title="Télécharger le document"
                        >
                          <Download className="w-5 h-5" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Télécharger
                          </span>
                        </button>
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
