import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Camera, Save, X, LogOut, Sun, Moon, Monitor, Palette, Trash2, AlertTriangle, Database, FileText, Shield, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { usePresence } from '../hooks/usePresence';
import { usePermissions } from '../hooks/usePermissions';
import { Card } from '../components/ui/Card';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role_level: string;
  bio?: string;
  avatar: string;
  created_at: string;
}

// Liste des avatars prédéfinis (Dicebear - plusieurs styles)
const AVATARS = [
  // Style Avataaars (cartoon humain)
  { id: 'avataaars-1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', name: 'Felix', style: 'avataaars' },
  { id: 'avataaars-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', name: 'Aneka', style: 'avataaars' },
  { id: 'avataaars-3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie', name: 'Marie', style: 'avataaars' },
  { id: 'avataaars-4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', name: 'John', style: 'avataaars' },
  { id: 'avataaars-5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', name: 'Sophie', style: 'avataaars' },
  { id: 'avataaars-6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', name: 'Lucas', style: 'avataaars' },
  { id: 'avataaars-7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', name: 'Emma', style: 'avataaars' },
  { id: 'avataaars-8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas', name: 'Thomas', style: 'avataaars' },
  // Style Lorelei (visage artistique)
  { id: 'lorelei-1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Julia', name: 'Julia', style: 'lorelei' },
  { id: 'lorelei-2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Martin', name: 'Martin', style: 'lorelei' },
  { id: 'lorelei-3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Lea', name: 'Léa', style: 'lorelei' },
  { id: 'lorelei-4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Hugo', name: 'Hugo', style: 'lorelei' },
  { id: 'lorelei-5', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Chloe', name: 'Chloé', style: 'lorelei' },
  { id: 'lorelei-6', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Antoine', name: 'Antoine', style: 'lorelei' },
  // Style Notionists (minimaliste)
  { id: 'notionists-1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alice', name: 'Alice', style: 'notionists' },
  { id: 'notionists-2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bob', name: 'Bob', style: 'notionists' },
  { id: 'notionists-3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Clara', name: 'Clara', style: 'notionists' },
  { id: 'notionists-4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Daniel', name: 'Daniel', style: 'notionists' },
  { id: 'notionists-5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Eva', name: 'Eva', style: 'notionists' },
  { id: 'notionists-6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Francois', name: 'François', style: 'notionists' },
  // Style Personas (moderne)
  { id: 'personas-1', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Gabriel', name: 'Gabriel', style: 'personas' },
  { id: 'personas-2', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Helene', name: 'Hélène', style: 'personas' },
  { id: 'personas-3', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Ivan', name: 'Ivan', style: 'personas' },
  { id: 'personas-4', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Jeanne', name: 'Jeanne', style: 'personas' },
  { id: 'personas-5', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Kevin', name: 'Kevin', style: 'personas' },
  { id: 'personas-6', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Louise', name: 'Louise', style: 'personas' },
  // Style Fun Emoji
  { id: 'fun-emoji-1', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy', name: 'Happy', style: 'fun-emoji' },
  { id: 'fun-emoji-2', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool', name: 'Cool', style: 'fun-emoji' },
  { id: 'fun-emoji-3', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Chill', name: 'Chill', style: 'fun-emoji' },
  { id: 'fun-emoji-4', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smile', name: 'Smile', style: 'fun-emoji' },
  // Style Bottts (robots)
  { id: 'bottts-1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=R2D2', name: 'R2D2', style: 'bottts' },
  { id: 'bottts-2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=C3PO', name: 'C3PO', style: 'bottts' },
  { id: 'bottts-3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bender', name: 'Bender', style: 'bottts' },
  { id: 'bottts-4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Wall-E', name: 'Wall-E', style: 'bottts' },
  // Style Thumbs (pouces)
  { id: 'thumbs-1', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Pro', name: 'Pro', style: 'thumbs' },
  { id: 'thumbs-2', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Expert', name: 'Expert', style: 'thumbs' },
  // Style Initials (pour fallback)
  { id: 'initials-1', url: 'https://api.dicebear.com/7.x/initials/svg?seed=FO&backgroundColor=3b82f6', name: 'FO', style: 'initials' },
  { id: 'initials-2', url: 'https://api.dicebear.com/7.x/initials/svg?seed=ME&backgroundColor=10b981', name: 'ME', style: 'initials' },
];

// Styles disponibles pour le filtre
const AVATAR_STYLES = [
  { id: 'all', label: 'Tous' },
  { id: 'avataaars', label: 'Cartoon' },
  { id: 'lorelei', label: 'Artistique' },
  { id: 'notionists', label: 'Minimaliste' },
  { id: 'personas', label: 'Moderne' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'bottts', label: 'Robots' },
  { id: 'thumbs', label: 'Pouces' },
  { id: 'initials', label: 'Initiales' },
];

const getRoleLabel = (role: string) => {
  const roles: { [key: string]: { label: string; color: string } } = {
    super_admin: { label: 'Super Administrateur', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    secretary_general: { label: 'Secrétaire Général', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    secretary_federal: { label: 'Secrétaire Fédéral', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    secretary: { label: 'Secrétaire', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  };
  return roles[role] || roles['secretary'];
};

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { updatePresence } = usePresence();
  const { isReadOnly } = usePermissions();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarStyleFilter, setAvatarStyleFilter] = useState('all');
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Tracker la présence sur la page profil
  useEffect(() => {
    updatePresence('profile', null);
  }, [updatePresence]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: 'avatar-1'
  });

  // Vérifier si l'utilisateur est super admin
  const isSuperAdmin = profile?.role_level === 'super_admin';

  // Sections disponibles pour la purge
  const purgeableSections = [
    { id: 'docease_documents', name: 'Documents DocEase', icon: FileText, description: 'Documents générés via DocEase', color: 'red' },
    { id: 'documents', name: 'Documents', icon: FileText, description: 'Documents du tableau de bord', color: 'orange' },
    { id: 'signatures', name: 'Signatures', icon: FileText, description: 'Signatures des documents', color: 'yellow' },
    { id: 'activities', name: 'Activités', icon: Database, description: 'Historique des activités', color: 'blue' },
    { id: 'bookmarks', name: 'Favoris', icon: Database, description: 'Favoris des utilisateurs', color: 'purple' },
  ];

  // Fonction pour vider une section
  const handlePurgeSection = async (sectionId: string) => {
    // Bloquer en mode lecture seule
    if (isReadOnly) {
      addToast('Mode observation : aucune action n\'est possible', 'info');
      return;
    }
    
    if (!isSuperAdmin) {
      addToast('Accès refusé: Super Admin uniquement', 'error');
      return;
    }

    setDeletingSection(sectionId);
    try {
      // D'abord récupérer tous les IDs
      const { data: items, error: fetchError } = await supabase
        .from(sectionId)
        .select('id');
      
      if (fetchError) throw fetchError;
      
      if (!items || items.length === 0) {
        addToast('Cette section est déjà vide', 'info');
        setConfirmDelete(null);
        setDeletingSection(null);
        return;
      }

      // Supprimer par lots de 100
      const ids = items.map(item => item.id);
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { error: deleteError } = await supabase
          .from(sectionId)
          .delete()
          .in('id', batch);
        
        if (deleteError) throw deleteError;
      }

      // Si c'est docease_documents, vider aussi le bucket storage
      if (sectionId === 'docease_documents') {
        try {
          const { data: files } = await supabase.storage.from('docease-files').list();
          if (files && files.length > 0) {
            const filePaths = files.map(f => f.name);
            await supabase.storage.from('docease-files').remove(filePaths);
          }
        } catch (storageError) {
          console.warn('Erreur nettoyage storage:', storageError);
        }
      }

      addToast(`Section "${purgeableSections.find(s => s.id === sectionId)?.name}" vidée avec succès (${ids.length} éléments supprimés)`, 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Erreur purge:', error);
      addToast(`Erreur lors de la purge: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    } finally {
      setDeletingSection(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erreur chargement profil:', error);
      addToast('Erreur lors du chargement du profil', 'error');
    } else {
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        avatar: data.avatar || 'avatar-1'
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    // Bloquer en mode lecture seule
    if (isReadOnly) {
      addToast('Mode observation : aucune action n\'est possible', 'info');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        name: formData.name,
        phone: formData.phone,
        avatar: formData.avatar
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Erreur mise à jour profil:', error);
      addToast('Erreur lors de la mise à jour', 'error');
    } else {
      addToast('Profil mis à jour avec succès', 'success');
      await fetchProfile();
      // Rafraîchir l'utilisateur dans le contexte pour mettre à jour le Header
      await refreshUser();
    }
    setSaving(false);
  };

  const getAvatarData = (avatarId?: string) => {
    return AVATARS.find(a => a.id === avatarId || a.url === avatarId) || AVATARS[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Chargement...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Profil introuvable</div>
      </div>
    );
  }

  const currentAvatar = getAvatarData(formData.avatar);
  const roleInfo = getRoleLabel(profile.role_level);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Bannière mode lecture seule */}
        {isReadOnly && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Mode observation — Aucune modification possible</span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Mon Profil</h1>
          <p className="text-slate-600 dark:text-slate-400">Gérez vos informations personnelles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Avatar + Paramètres */}
          <div className="lg:col-span-1 space-y-6">
            {/* Carte Avatar */}
            <Card>
            <div className="p-6">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-1 shadow-lg">
                    <img
                      src={currentAvatar.url}
                      alt="Avatar"
                      className="w-full h-full rounded-full bg-white dark:bg-slate-800"
                    />
                  </div>
                  {/* Bouton changer avatar - masqué en mode lecture seule */}
                  {!isReadOnly && (
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg border-2 border-slate-100 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  )}
                </div>

                {/* Info basiques */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{profile.name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{profile.email}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>

                {/* Date de création */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 w-full">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Carte Thème */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Apparence
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className={`font-medium ${theme === 'light' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Thème clair
                  </span>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className={`font-medium ${theme === 'dark' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Thème sombre
                  </span>
                </button>

                <button
                  onClick={() => setTheme('system')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    theme === 'system'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Monitor className={`w-5 h-5 ${theme === 'system' ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`} />
                  <span className={`font-medium ${theme === 'system' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Système
                  </span>
                </button>
              </div>
            </div>
          </Card>

          {/* Bouton Déconnexion - masqué en mode lecture seule */}
          {!isReadOnly && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
          )}

          {/* Section Administration - Super Admin uniquement et pas en mode lecture seule */}
          {isSuperAdmin && !isReadOnly && (
            <Card className="border-2 border-red-200 dark:border-red-800">
              <div className="p-6">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Administration
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Actions réservées aux Super Administrateurs. Ces actions sont irréversibles.
                </p>
                
                <div className="space-y-3">
                  {purgeableSections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <section.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{section.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
                        </div>
                      </div>
                      
                      {confirmDelete === section.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePurgeSection(section.id)}
                            disabled={deletingSection === section.id}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            {deletingSection === section.id ? 'Suppression...' : 'Confirmer'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(section.id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-full transition-colors"
                          title="Vider cette section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>Attention :</strong> La suppression des données est définitive et ne peut pas être annulée. 
                      Assurez-vous d'avoir une sauvegarde si nécessaire.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

          {/* Carte Informations */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Informations personnelles</h3>
              
              <div className="space-y-6">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Votre nom complet"
                  />
                </div>

                {/* Email (lecture seule) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">L'email ne peut pas être modifié</p>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                {/* Bouton Enregistrer - masqué en mode lecture seule */}
                {!isReadOnly && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Modal Sélection Avatar */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choisir un avatar</h3>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Filtres par style */}
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setAvatarStyleFilter(style.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        avatarStyleFilter === style.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille d'avatars avec scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {/* Option: Pas d'avatar (initiales) */}
                  <button
                    onClick={() => {
                      setFormData({ ...formData, avatar: '' });
                      setShowAvatarPicker(false);
                    }}
                    className={`relative aspect-square rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 p-1 transition-all hover:scale-105 flex items-center justify-center ${
                      !formData.avatar || formData.avatar === ''
                        ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800'
                        : 'hover:ring-2 ring-slate-300 dark:ring-slate-600'
                    }`}
                    title="Utiliser les initiales"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <User className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Initiales</span>
                    </div>
                  </button>

                  {/* Avatars filtrés */}
                  {AVATARS
                    .filter(avatar => avatarStyleFilter === 'all' || avatar.style === avatarStyleFilter)
                    .map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        setFormData({ ...formData, avatar: avatar.url });
                        setShowAvatarPicker(false);
                      }}
                      className={`relative aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-1 transition-all hover:scale-105 group ${
                        formData.avatar === avatar.url
                          ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800'
                          : 'hover:ring-2 ring-slate-300 dark:ring-slate-600'
                      }`}
                      title={avatar.name}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full rounded-lg"
                        loading="lazy"
                      />
                      {/* Nom au survol */}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] text-center py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {avatar.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer avec compteur */}
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  {avatarStyleFilter === 'all' 
                    ? `${AVATARS.length} avatars disponibles` 
                    : `${AVATARS.filter(a => a.style === avatarStyleFilter).length} avatars dans ce style`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
