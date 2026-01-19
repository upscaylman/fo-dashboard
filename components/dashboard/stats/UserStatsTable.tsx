import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Edit3, UserPlus, Trash2, ChevronDown, X, Send, RefreshCw, Eye, Calendar, Mail, Shield, Activity, BarChart3 } from 'lucide-react';
import { UserStat } from '../../../types';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ROLE_COLORS, ROLE_LABELS, UserRole } from '../../../lib/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { TimeRange } from '../../../hooks/useStats';
import { DASHBOARD_REGISTER_URL } from '../../../constants';
import SelectBottomSheet from '../../ui/SelectBottomSheet';

interface UserStatsTableProps {
  users: UserStat[];
  timeRange?: TimeRange;
}

// Helper pour obtenir le label de période
const getPeriodLabel = (range: TimeRange): string => {
  switch (range) {
    case 'week': return 'ces 7 derniers jours';
    case 'month': return 'ce mois-ci';
    case 'quarter': return 'ce trimestre';
    case 'year': return 'cette année';
    default: return 'ce mois-ci';
  }
};

// Helper pour obtenir la date de début selon la période
const getStartDateFromRange = (range: TimeRange): Date => {
  const now = new Date();
  switch (range) {
    case 'week':
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return weekAgo;
    case 'month':
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      monthAgo.setHours(0, 0, 0, 0);
      return monthAgo;
    case 'quarter':
      const quarterAgo = new Date();
      quarterAgo.setDate(now.getDate() - 90);
      quarterAgo.setHours(0, 0, 0, 0);
      return quarterAgo;
    case 'year':
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      yearAgo.setHours(0, 0, 0, 0);
      return yearAgo;
    default:
      const defaultAgo = new Date();
      defaultAgo.setDate(now.getDate() - 30);
      defaultAgo.setHours(0, 0, 0, 0);
      return defaultAgo;
  }
};

// Interface pour les détails utilisateur
interface UserDetails {
  user: UserStat;
  doceaseDocuments: any[];
  signeaseActivities: any[];
  bookmarks: any[];
  recentActivity: any[];
}

const UserStatsTable: React.FC<UserStatsTableProps> = ({ users, timeRange = 'month' }) => {
  const [localUsers, setLocalUsers] = useState<UserStat[]>(users);
  const [userStats, setUserStats] = useState<Map<string, { letters: number; signatures: number }>>(new Map());
  const [loadingStats, setLoadingStats] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role_level: 'secretary' as UserRole
  });
  const { addToast } = useToast();
  const { user: currentUser, impersonate, isImpersonating, realUser } = useAuth();
  const { isSuperAdmin, isAdmin, isRealSuperAdmin, isReadOnly } = usePermissions();

  // Vérifier si le vrai utilisateur (pas celui impersonné) est super admin
  // Utiliser isRealSuperAdmin qui gère correctement l'impersonation
  const realIsSuperAdmin = isRealSuperAdmin();
  
  // Pour l'affichage, on utilise le rôle effectif (celui impersonné si applicable)
  const effectiveIsSuperAdmin = isSuperAdmin();
  
  // Le rôle effectif détermine si on peut voir toutes les données
  const canViewAllUsers = effectiveIsSuperAdmin || currentUser?.role === 'secretary_general' || currentUser?.role === 'secretary';
  
  // Le secrétaire fédéral et le secrétaire ne voient que leurs propres données
  const isRestrictedRole = currentUser?.role === 'secretary_federal' || currentUser?.role === 'secretary';

  // En mode lecture seule (impersonation), aucune action n'est permise
  // Le super_admin peut observer mais pas interagir

  // Fonction pour voir en tant que (désactivée en mode lecture seule)
  const handleImpersonate = (user: UserStat) => {
    if (isReadOnly) {
      addToast('Mode observation : aucune action n\'est possible', 'info');
      return;
    }
    impersonate({
      id: user.id,
      name: user.name,
      email: user.email, // Email nécessaire pour filtrer SignEase correctement
      role: user.role,
      avatar: user.avatar_url || undefined,
    });
    addToast(`Vous voyez maintenant l'interface en tant que ${user.name}`, 'info');
  };

  // Fonction pour charger les détails d'un utilisateur (Super Admin uniquement)
  const handleViewUserDetails = async (user: UserStat) => {
    if (!realIsSuperAdmin) return;
    
    setLoadingDetails(true);
    setShowUserDetailsModal(true);
    
    try {
      // Récupérer les documents DocEase de l'utilisateur
      const { data: doceaseData } = await supabase
        .from('docease_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les activités SignEase liées à l'email de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      const userEmail = userData?.email || '';
      
      const { data: signeaseData } = await supabase
        .from('signease_activity')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les favoris de l'utilisateur
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les sessions actives
      const { data: sessionsData } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false })
        .limit(5);

      setSelectedUserDetails({
        user: { ...user, email: userEmail } as UserStat,
        doceaseDocuments: doceaseData || [],
        signeaseActivities: signeaseData || [],
        bookmarks: bookmarksData || [],
        recentActivity: sessionsData || [],
      });
    } catch (error) {
      console.error('Erreur chargement détails utilisateur:', error);
      addToast('Erreur lors du chargement des détails', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Charger les stats utilisateurs selon la période
  const fetchUserStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const periodStart = getStartDateFromRange(timeRange);
      const statsMap = new Map<string, { letters: number; signatures: number }>();
      
      // Récupérer les documents DocEase par utilisateur
      const { data: doceaseData } = await supabase
        .from('docease_documents')
        .select('user_id')
        .gte('created_at', periodStart.toISOString());
      
      // Récupérer les signatures par utilisateur
      const { data: signaturesData } = await supabase
        .from('signatures')
        .select('user_id')
        .gte('signed_at', periodStart.toISOString());
      
      // Compter par user_id
      doceaseData?.forEach(doc => {
        const key = doc.user_id;
        if (key) {
          const current = statsMap.get(key) || { letters: 0, signatures: 0 };
          current.letters++;
          statsMap.set(key, current);
        }
      });
      
      signaturesData?.forEach(sig => {
        if (sig.user_id) {
          const current = statsMap.get(sig.user_id) || { letters: 0, signatures: 0 };
          current.signatures++;
          statsMap.set(sig.user_id, current);
        }
      });
      
      setUserStats(statsMap);
    } catch (error) {
      console.error('Erreur chargement stats utilisateurs:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [timeRange]);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // Check permissions - désactiver en mode lecture seule
  // secretary et secretary_general ont les mêmes droits de gestion
  const canManage = !isReadOnly && (currentUser?.role === 'secretary' || currentUser?.role === 'secretary_general' || currentUser?.role === 'super_admin');

  // Role options from migration
  const availableRoles: { value: UserRole; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'secretary_general', label: 'Secrétaire Général' },
    { value: 'secretary_federal', label: 'Secrétaire Fédéral' },
    { value: 'secretary', label: 'Secrétaire' },
  ];

  // [NEW] Handle Role Change
  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    if (!canManage) return;

    // Optimistic update
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addToast(`Rôle de ${userName} mis à jour vers ${ROLE_LABELS[newRole as UserRole] || newRole}`, 'info');

    try {
      const { error } = await supabase
        .from('users')
        .update({ role_level: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }
      addToast(`Rôle sauvegardé avec succès`, 'success');
    } catch (error: any) {
      console.error('Erreur mise à jour rôle:', error);
      addToast(`Erreur lors de la mise à jour: ${error.message}`, 'error');
      // Revert optimism if needed (not implemented here for simplicity, but recommended)
    }
  };


  const handleDelete = async (indexToDelete: number, userStat: UserStat) => {
    if (!canManage || isReadOnly) {
      if (isReadOnly) {
        addToast('Mode observation : aucune action n\'est possible', 'info');
      }
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${userStat.name} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', userStat.id);

      if (error) throw error;

      setLocalUsers((prev) => prev.filter((_, index) => index !== indexToDelete));
      addToast(`Salarié ${userStat.name} supprimé avec succès`, 'success');
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      addToast(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
  };

  const handleInvite = () => {
    if (isReadOnly) {
      addToast('Mode observation : aucune action n\'est possible', 'info');
      return;
    }
    const inviteUrl = `${window.location.origin}/register`;
    navigator.clipboard.writeText(inviteUrl);
    addToast("Lien d'inscription copié dans le presse-papier !", 'success');
  };

  const handleAddUser = async () => {
    if (isReadOnly) {
      addToast('Mode observation : aucune action n\'est possible', 'info');
      return;
    }
    
    if (!isSuperAdmin) {
      addToast('Seuls les super admins peuvent ajouter des utilisateurs', 'error');
      return;
    }

    // Validation
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      addToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (newUser.password.length < 8) {
      addToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(newUser.password)) {
      addToast('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      addToast('Email invalide', 'error');
      return;
    }

    try {
      // 1. Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role_level
          },
          // Rediriger vers la page de connexion après confirmation
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;

      // Vérifier si l'utilisateur existe déjà
      if (authData.user?.identities?.length === 0) {
        addToast('Cet email est déjà utilisé par un autre compte', 'error');
        return;
      }

      // 2. Vérifier si l'utilisateur a été créé dans la table users (via trigger)
      if (authData.user) {
        // Attendre un peu pour le trigger
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Mettre à jour le role_level dans la table users
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role_level: newUser.role_level,
            name: newUser.name
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.warn('Erreur mise à jour role:', updateError);
          // Le trigger peut ne pas avoir encore créé l'utilisateur, on continue
        }

        // 4. Ajouter à la liste locale
        const newUserStat: UserStat = {
          id: authData.user.id,
          name: newUser.name,
          email: newUser.email,
          letters: 0,
          signatures: 0,
          role: newUser.role_level
        };

        setLocalUsers(prev => [...prev, newUserStat]);
        
        // Reset form and close modal
        setNewUser({ name: '', email: '', password: '', role_level: 'secretary' });
        setShowAddModal(false);
        
        // Message de succès avec instruction
        addToast(`Compte créé ! Un email de confirmation a été envoyé à ${newUser.email}. L'utilisateur doit confirmer son email avant de se connecter.`, 'success');
      }
    } catch (error: any) {
      console.error('Erreur ajout utilisateur:', error);
      if (error.message?.includes('already registered')) {
        addToast('Cet email est déjà utilisé par un autre compte', 'error');
      } else {
        addToast(`Erreur: ${error.message}`, 'error');
      }
    }
  };

  // Calculer les stats avec les données dynamiques
  // IMPORTANT: Le secrétaire fédéral et le secrétaire ne voient que leurs propres données
  const enrichedUsers = useMemo(() => {
    let filteredUsers = localUsers;
    
    // Si l'utilisateur est secretary_federal ou secretary, ne montrer que lui-même
    if (isRestrictedRole && currentUser?.id) {
      filteredUsers = localUsers.filter(user => user.id === currentUser.id);
    }
    
    return filteredUsers.map(user => {
      const stats = userStats.get(user.id);
      return {
        ...user,
        letters: stats?.letters ?? user.letters,
        signatures: stats?.signatures ?? user.signatures,
      };
    });
  }, [localUsers, userStats, isRestrictedRole, currentUser?.id]);

  return (
    <Card className="!p-0 overflow-hidden">
      {/* Bannière mode lecture seule */}
      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Mode observation — Aucune action n'est possible</span>
          </div>
        </div>
      )}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">Activité Salariés</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Performances de l'équipe {getPeriodLabel(timeRange)}</p>
            </div>
            {loadingStats && (
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>
          {/* Show buttons only for admins - hidden in read-only mode */}
          {canManage && !isReadOnly && (
            <div className="flex gap-2">
              {isSuperAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                  title="Ajouter un salarié"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
              <a
                href={DASHBOARD_REGISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-fo-dark hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-full transition-all shadow-lg shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-700"
                title="Inviter un salarié"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <th className="px-6 py-4 rounded-tl-2xl">Salarié</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4 text-center">Lettres</th>
              <th className="px-6 py-4 text-center">Signatures</th>
              <th className="px-6 py-4 text-center">Total</th>
              <th className="px-6 py-4 rounded-tr-2xl w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900">
            {enrichedUsers.map((user, idx) => {
              // Determine styles based on role
              const currentRole = user.role as UserRole;
              const roleStyles = ROLE_COLORS[currentRole] || ROLE_COLORS['secretary'];

              return (
                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url && user.avatar_url.trim() !== '' ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover shadow-md shadow-blue-200 dark:shadow-none"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white items-center justify-center font-bold text-sm shadow-md shadow-blue-200 dark:shadow-none"
                        style={{ display: user.avatar_url && user.avatar_url.trim() !== '' ? 'none' : 'flex' }}
                      >
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">{user.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {/* Role Selector for Admins */}
                    {canManage ? (
                      <SelectBottomSheet
                        value={user.role}
                        onChange={(value) => handleRoleChange(user.id, value, user.name)}
                        options={availableRoles}
                        aria-label="Changer le rôle"
                        renderTrigger={({ onClick }) => (
                          <div 
                            onClick={onClick}
                            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer hover:shadow-sm transition-all ${roleStyles.bg} ${roleStyles.text} ${roleStyles.border}`}
                          >
                            <span className="truncate max-w-[120px]">{ROLE_LABELS[currentRole] || user.role}</span>
                            <ChevronDown className="w-3 h-3 opacity-70" />
                          </div>
                        )}
                      />
                    ) : (
                      <Badge variant="slate" size="sm">{ROLE_LABELS[currentRole] || user.role}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-bold text-sm">
                      <FileText className="w-3.5 h-3.5" /> {user.letters}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold text-sm">
                      <Edit3 className="w-3.5 h-3.5" /> {user.signatures}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{user.letters + user.signatures}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {/* Actions masquées en mode lecture seule */}
                    {isReadOnly ? (
                      <span className="text-slate-400 text-sm italic">Observation</span>
                    ) : (
                    <div className="flex items-center justify-center gap-1">
                      {/* Bouton "Voir les données" - Super Admin uniquement */}
                      {realIsSuperAdmin && (
                        <button
                          onClick={() => handleViewUserDetails(user)}
                          className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title={`Voir les données de ${user.name}`}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      {/* Bouton "Voir en tant que" - Super Admin uniquement (pour les autres utilisateurs) */}
                      {realIsSuperAdmin && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleImpersonate(user)}
                          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={`Se connecter en tant que ${user.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {/* Bouton Supprimer - Admins uniquement */}
                      {canManage && (
                        <button
                          onClick={() => handleDelete(idx, user)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {localUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                  Aucun salarié trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout de salarié */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ajouter un salarié</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Créer un nouveau compte utilisateur</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Ex: jean.dupont@fo-metaux.fr"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min. 8 car. + caractère spécial"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">8 caractères minimum + 1 caractère spécial (!@#$%...)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <SelectBottomSheet
                  value={newUser.role_level}
                  onChange={(value) => setNewUser({ ...newUser, role_level: value as UserRole })}
                  options={availableRoles}
                  label="Sélectionner un rôle"
                  aria-label="Sélectionner un rôle"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              {/* Note d'information */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Note :</strong> Un email de confirmation sera envoyé à l'adresse indiquée. L'utilisateur devra cliquer sur le lien pour activer son compte.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  Créer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails utilisateur - Super Admin uniquement */}
      {showUserDetailsModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-4">
                {selectedUserDetails?.user.avatar_url ? (
                  <img 
                    src={selectedUserDetails.user.avatar_url} 
                    alt={selectedUserDetails.user.name}
                    className="w-12 h-12 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {selectedUserDetails?.user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedUserDetails?.user.name}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[selectedUserDetails?.user.role as UserRole]?.bg} ${ROLE_COLORS[selectedUserDetails?.user.role as UserRole]?.text}`}>
                      {ROLE_LABELS[selectedUserDetails?.user.role as UserRole]}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {(selectedUserDetails?.user as any)?.email || 'Email non disponible'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserDetailsModal(false);
                  setSelectedUserDetails(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Statistiques rapides */}
                  <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">DocEase</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{selectedUserDetails?.doceaseDocuments.length || 0}</p>
                    </div>
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-1">
                        <Edit3 className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">SignEase</span>
                      </div>
                      <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">{selectedUserDetails?.signeaseActivities.length || 0}</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Favoris</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{selectedUserDetails?.bookmarks.length || 0}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Sessions</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{selectedUserDetails?.recentActivity.length || 0}</p>
                    </div>
                  </div>

                  {/* Documents DocEase */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      Documents DocEase récents
                    </h4>
                    {selectedUserDetails?.doceaseDocuments.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucun document</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUserDetails?.doceaseDocuments.map((doc: any) => (
                          <div key={doc.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{doc.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">{doc.document_type}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Activités SignEase */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-pink-500" />
                      Activités SignEase récentes
                    </h4>
                    {selectedUserDetails?.signeaseActivities.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune activité</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUserDetails?.signeaseActivities.map((activity: any) => (
                          <div key={activity.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{activity.document_name || 'Document sans nom'}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className={`px-2 py-0.5 rounded-full ${
                                activity.action_type === 'document_signed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                activity.action_type === 'document_sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                activity.action_type === 'document_rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}>
                                {activity.action_type?.replace('document_', '').replace('_', ' ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Favoris */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-amber-500" />
                      Favoris
                    </h4>
                    {selectedUserDetails?.bookmarks.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucun favori</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUserDetails?.bookmarks.map((bookmark: any) => (
                          <div key={bookmark.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{bookmark.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{bookmark.item_type}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sessions récentes */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      Sessions récentes
                    </h4>
                    {selectedUserDetails?.recentActivity.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune session</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUserDetails?.recentActivity.map((session: any) => (
                          <div key={session.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-900 dark:text-white text-sm">{session.current_page || 'Dashboard'}</p>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {session.current_tool || 'Navigation'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(session.last_activity).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-3 h-3 inline mr-1" />
                Données accessibles uniquement par Super Admin
              </p>
              <button
                onClick={() => {
                  setShowUserDetailsModal(false);
                  setSelectedUserDetails(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserStatsTable;
