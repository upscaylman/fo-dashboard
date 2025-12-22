import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Edit3, UserPlus, Trash2, ChevronDown, X, Send, RefreshCw, Eye } from 'lucide-react';
import { UserStat } from '../../../types';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ROLE_COLORS, ROLE_LABELS, UserRole } from '../../../lib/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { TimeRange } from '../../../hooks/useStats';

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

const UserStatsTable: React.FC<UserStatsTableProps> = ({ users, timeRange = 'month' }) => {
  const [localUsers, setLocalUsers] = useState<UserStat[]>(users);
  const [userStats, setUserStats] = useState<Map<string, { letters: number; signatures: number }>>(new Map());
  const [loadingStats, setLoadingStats] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role_level: 'secretary' as UserRole
  });
  const { addToast } = useToast();
  const { user: currentUser, impersonate, isImpersonating, realUser } = useAuth();
  const { isSuperAdmin } = usePermissions();

  // Vérifier si le vrai utilisateur (pas celui impersonné) est super admin
  const isSuperAdminResult = isSuperAdmin();
  const realIsSuperAdmin = isSuperAdminResult || realUser?.role === 'super_admin' || currentUser?.role === 'super_admin';
  
  // Debug: afficher dans la console
  console.log('🔐 Super Admin Check:', 
    'isSuperAdmin()=', isSuperAdminResult, 
    'realUser?.role=', realUser?.role, 
    'currentUser?.role=', currentUser?.role,
    'RESULT=', realIsSuperAdmin 
  );

  // Fonction pour voir en tant que
  const handleImpersonate = (user: UserStat) => {
    impersonate({
      id: user.id,
      name: user.name,
      email: '', // On n'a pas l'email dans UserStat, mais c'est OK pour l'affichage
      role: user.role,
      avatar: user.avatar_url || undefined,
    });
    addToast(`Vous voyez maintenant l'interface en tant que ${user.name}`, 'info');
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

  // Check permissions
  const canManage = currentUser?.role === 'secretary_general' || currentUser?.role === 'super_admin';

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
    if (!canManage) return;

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
    const inviteUrl = `${window.location.origin}/register`;
    navigator.clipboard.writeText(inviteUrl);
    addToast("Lien d'inscription copié dans le presse-papier !", 'success');
  };

  const handleAddUser = async () => {
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
  const enrichedUsers = useMemo(() => {
    return localUsers.map(user => {
      const stats = userStats.get(user.id);
      return {
        ...user,
        letters: stats?.letters ?? user.letters,
        signatures: stats?.signatures ?? user.signatures,
      };
    });
  }, [localUsers, userStats]);

  return (
    <Card className="!p-0 overflow-hidden">
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
          {/* Show buttons only for admins */}
          {canManage && (
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
                href="https://fde-saasease.netlify.app/register"
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
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover shadow-md shadow-blue-200 dark:shadow-none"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200 dark:shadow-none ${user.avatar_url ? 'hidden' : ''}`}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">{user.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {/* Role Selector for Admins */}
                    {canManage ? (
                      <div className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer hover:shadow-sm transition-all ${roleStyles.bg} ${roleStyles.text} ${roleStyles.border}`}>
                        <span className="truncate max-w-[120px]">{ROLE_LABELS[currentRole] || user.role}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                          style={{ 
                            paddingLeft: '12px',
                            paddingRight: '12px'
                          }}
                          aria-label="Changer le rôle"
                        >
                          {availableRoles.map(role => (
                            <option
                              key={role.value}
                              value={role.value}
                              className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100 py-2 px-3"
                            >
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
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
                    <div className="flex items-center justify-center gap-1">
                      {/* Bouton "Voir en tant que" - Super Admin uniquement */}
                      {realIsSuperAdmin && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleImpersonate(user)}
                          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={`Voir en tant que ${user.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {/* Debug: Afficher toujours pour test */}
                      {!realIsSuperAdmin && (
                        <span className="text-xs text-gray-400" title="Non super admin">—</span>
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
                <div className="relative">
                  <select
                    value={newUser.role_level}
                    onChange={(e) => setNewUser({ ...newUser, role_level: e.target.value as UserRole })}
                    className="appearance-none cursor-pointer w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                  >
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value} className="py-2 px-3">
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
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
    </Card>
  );
};

export default UserStatsTable;