import React, { useState, useEffect } from 'react';
import { FileText, Edit3, UserPlus, Trash2, ChevronDown } from 'lucide-react';
import { UserStat } from '../../../types';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ROLE_COLORS, ROLE_LABELS, UserRole } from '../../../lib/permissions';

interface UserStatsTableProps {
  users: UserStat[];
}

const UserStatsTable: React.FC<UserStatsTableProps> = ({ users }) => {
  const [localUsers, setLocalUsers] = useState<UserStat[]>(users);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Check permissions
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // Role options from migration
  const availableRoles: { value: UserRole; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'secretary_general', label: 'Secrétaire Général' },
    { value: 'secretary', label: 'Secrétaire' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'guest', label: 'Invité' },
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

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">Activité Salariés</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Performances de l'équipe ce mois-ci</p>
          </div>
          {/* Show button only for admins */}
          {canManage && (
            <button
              onClick={handleInvite}
              className="flex items-center gap-2 px-4 py-2 bg-fo-dark hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-700"
            >
              <UserPlus className="w-4 h-4" />
              <span>Inviter</span>
            </button>
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
            {localUsers.map((user, idx) => {
              // Determine styles based on role
              const currentRole = user.role as UserRole;
              const roleStyles = ROLE_COLORS[currentRole] || ROLE_COLORS['secretary'];

              return (
                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200 dark:shadow-none">
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
                    {/* Show button only for admins */}
                    {canManage && (
                      <button
                        onClick={() => handleDelete(idx, user)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
    </Card>
  );
};

export default UserStatsTable;