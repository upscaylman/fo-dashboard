import React, { useState, useEffect } from 'react';
import { FileText, Edit3, UserPlus, Trash2 } from 'lucide-react';
import { UserStat } from '../../../types';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../../context/ToastContext';

interface UserStatsTableProps {
  users: UserStat[];
}

const UserStatsTable: React.FC<UserStatsTableProps> = ({ users }) => {
  const [localUsers, setLocalUsers] = useState<UserStat[]>(users);
  const { addToast } = useToast();

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const handleDelete = (indexToDelete: number, name: string) => {
    setLocalUsers((prev) => prev.filter((_, index) => index !== indexToDelete));
    addToast(`Salarié ${name} supprimé`, 'info');
  };

  return (
    <Card className="!p-0 overflow-hidden">
       <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">Activité Salariés</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Performances de l'équipe ce mois-ci</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-fo-dark hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-700">
                    <UserPlus className="w-4 h-4" />
                    <span>Inviter</span>
                </button>
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
            {localUsers.map((user, idx) => (
              <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200 dark:shadow-none">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <Badge variant="slate" size="sm">{user.role}</Badge>
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
                    <button 
                        onClick={() => handleDelete(idx, user.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </td>
              </tr>
            ))}
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