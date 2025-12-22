import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Camera, Save, X, LogOut, Sun, Moon, Monitor, Palette, Trash2, AlertTriangle, Database, FileText, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { usePresence } from '../hooks/usePresence';
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

// Liste des avatars prédéfinis (Dicebear)
const AVATARS = [
  { id: 'avatar-1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', name: 'Felix' },
  { id: 'avatar-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', name: 'Aneka' },
  { id: 'avatar-3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie', name: 'Marie' },
  { id: 'avatar-4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', name: 'John' },
  { id: 'avatar-5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', name: 'Sophie' },
  { id: 'avatar-6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', name: 'Lucas' },
  { id: 'avatar-7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', name: 'Emma' },
  { id: 'avatar-8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas', name: 'Thomas' },
  { id: 'avatar-9', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julie', name: 'Julie' },
  { id: 'avatar-10', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', name: 'Alex' },
  { id: 'avatar-11', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', name: 'Sarah' },
  { id: 'avatar-12', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', name: 'David' },
  { id: 'avatar-13', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura', name: 'Laura' },
  { id: 'avatar-14', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc', name: 'Marc' },
  { id: 'avatar-15', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Claire', name: 'Claire' },
  { id: 'avatar-16', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre', name: 'Pierre' },
  { id: 'avatar-17', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camille', name: 'Camille' },
  { id: 'avatar-18', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maxime', name: 'Maxime' },
];

const getRoleLabel = (role: string) => {
  const roles: { [key: string]: { label: string; color: string } } = {
    super_admin: { label: 'Super Administrateur', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    admin: { label: 'Administrateur', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    secretary: { label: 'Secrétaire', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  return roles[role] || roles['secretary'];
};

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { updatePresence } = usePresence();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg border-2 border-slate-100 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
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

          {/* Bouton Déconnexion */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>

          {/* Section Administration - Super Admin uniquement */}
          {isSuperAdmin && (
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
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                {/* Bouton Enregistrer */}
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
              </div>
            </div>
          </Card>
        </div>

        {/* Modal Sélection Avatar */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choisir un avatar</h3>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setFormData({ ...formData, avatar: avatar.url });
                      setShowAvatarPicker(false);
                    }}
                    className={`relative aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-1 transition-all hover:scale-105 ${
                      formData.avatar === avatar.url || formData.avatar === avatar.id
                        ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800'
                        : 'hover:ring-2 ring-slate-300 dark:ring-slate-600'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full rounded-lg"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
