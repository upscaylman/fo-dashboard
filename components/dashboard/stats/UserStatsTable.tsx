
import React from 'react';
import { Award, FileText, Edit3, UserPlus } from 'lucide-react';
import { UserStat } from '../../../types';

interface UserStatsTableProps {
  users: UserStat[];
}

const UserStatsTable: React.FC<UserStatsTableProps> = ({ users }) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgb(216,194,191)] overflow-hidden">
       <div className="px-6 py-4 flex items-center justify-between border-b border-[rgb(216,194,191)]">
        <h3 className="font-semibold text-slate-900">Activité par utilisateur</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-full transition-colors">
          <UserPlus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-600">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-600">Rôle</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-600">
                <div className="flex items-center justify-center space-x-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Lettres</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center font-semibold text-slate-600">
                <div className="flex items-center justify-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-red-600" />
                  <span>Signatures</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center font-semibold text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-t border-[rgb(216,194,191)]">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-semibold text-slate-800">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.role}</td>
                <td className="px-6 py-4 text-center">
                  <span className="font-semibold text-purple-700">
                    {user.letters}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-semibold text-red-700">
                    {user.signatures}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-slate-900">{user.letters + user.signatures}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserStatsTable;
