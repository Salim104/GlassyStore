
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, ShieldAlert, MoreVertical, Mail, Calendar, X, Check, Trash2, Loader2, WifiOff } from 'lucide-react';
import { Profile } from '../types';
import { useAuthStore } from '../lib/store';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockUsers } from '../lib/mockData';

const Users = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const { user: currentUser } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    setIsUsingMock(false);
    try {
      if (!isSupabaseConfigured()) throw new Error("Not configured");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (err) {
      console.warn("Falling back to mock users:", err);
      setUsers(mockUsers);
      setIsUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRole = async (userId: string, currentRole: string) => {
    if (isUsingMock) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: currentRole === 'admin' ? 'user' : 'admin' } : u));
      return;
    }

    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'admin' | 'user' } : u));
    } catch (err) {
      console.error("Update role failed:", err);
      alert("Failed to update user role on server.");
    }
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) return alert("You cannot delete yourself!");
    if (!confirm("Are you sure you want to remove this user?")) return;

    if (isUsingMock) {
      setUsers(prev => prev.filter(u => u.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error("Delete user failed:", err);
      alert("Failed to delete user from server.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-slate-400 mt-1">Manage platform access and administrative privileges.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/20"
        >
          <UserPlus size={20} />
          <span>Add User</span>
        </button>
      </div>

      {isUsingMock && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center space-x-3">
          <WifiOff size={18} />
          <span>Connection failed. Viewing local mock user data.</span>
        </div>
      )}

      <div className="relative w-full md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-slate-400">Loading user data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-500 bg-white/5 tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">User Profile</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img 
                            src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full border border-white/10 object-cover"
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-500'}`}></div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-200">{user.name || 'Unnamed User'}</span>
                            {user.id === currentUser?.id && (
                              <span className="text-[10px] bg-white/10 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">You</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>Registered Member</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${
                        user.role === 'admin' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {user.role === 'admin' ? <Shield size={12} /> : <ShieldAlert size={12} />}
                        <span>{user.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Mail size={14} className="opacity-60" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button 
                          onClick={() => toggleRole(user.id, user.role)}
                          className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            user.role === 'admin'
                              ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                              : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10'
                          }`}
                        >
                          {user.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative w-full max-w-md glass-panel p-8 rounded-3xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Invite New Team Member</h3>
            <p className="text-slate-400 mb-6">Users should sign up via the public portal. Once they appear in this list, you can promote them to Admin.</p>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
