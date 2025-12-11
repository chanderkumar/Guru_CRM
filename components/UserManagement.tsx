import React, { useState } from 'react';
import { User, Role } from '../types';
import { Plus, Shield, User as UserIcon, Mail, Phone, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ToastType } from './Toast';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const initialUserState = { 
      name: '', 
      email: '', 
      password: '', 
      role: Role.TECHNICIAN, 
      phone: '', 
      address: '',
      status: 'Active' as 'Active' | 'Inactive'
  };
  
  const [userData, setUserData] = useState(initialUserState);

  const openAddModal = () => {
      setEditingUserId(null);
      setUserData(initialUserState);
      setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
      setEditingUserId(user.id);
      setUserData({
          name: user.name,
          email: user.email,
          password: '', // Don't show existing password
          role: user.role,
          phone: user.phone || '',
          address: user.address || '',
          status: user.status
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUserId) {
        // Update
        const updates: Partial<User> = {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            phone: userData.phone,
            address: userData.address,
            status: userData.status
        };
        // Only update password if provided
        if (userData.password) {
            updates.password = userData.password;
        }
        onUpdateUser(editingUserId, updates);
    } else {
        // Create
        if (!userData.password) {
            showToast("Password is required for new users.", "error");
            return;
        }
        onAddUser({
            id: `u${Date.now()}`,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            phone: userData.phone,
            address: userData.address,
            status: 'Active'
        });
    }
    
    setIsModalOpen(false);
  };
  
  const handleDelete = (id: string) => {
      if(confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          onDeleteUser(id);
      }
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500">Manage system access, roles, and profiles.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                     <tr>
                         <th className="px-6 py-4">User</th>
                         <th className="px-6 py-4">Contact</th>
                         <th className="px-6 py-4">Role</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {users.map(user => (
                         <tr key={user.id} className="hover:bg-gray-50 transition">
                             <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                         user.role === Role.ADMIN ? 'bg-purple-600' :
                                         user.role === Role.MANAGER ? 'bg-blue-600' : 'bg-green-600'
                                     }`}>
                                         {user.name.charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                         <p className="font-semibold text-gray-800">{user.name}</p>
                                         <p className="text-xs text-gray-500">ID: {user.id}</p>
                                     </div>
                                 </div>
                             </td>
                             <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1">
                                     <span className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {user.email}</span>
                                     {user.phone && <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {user.phone}</span>}
                                 </div>
                             </td>
                             <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                     user.role === Role.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                     user.role === Role.MANAGER ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                     'bg-green-50 text-green-700 border-green-200'
                                 }`}>
                                     {user.role}
                                 </span>
                             </td>
                             <td className="px-6 py-4">
                                 {user.status === 'Active' ? (
                                     <span className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase"><CheckCircle size={14}/> Active</span>
                                 ) : (
                                     <span className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase"><XCircle size={14}/> Inactive</span>
                                 )}
                             </td>
                             <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-2">
                                     <button onClick={() => openEditModal(user)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                                         <Edit2 size={16} />
                                     </button>
                                     <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition">
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingUserId ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input required className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input required type="email" className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input 
                        type="password" 
                        className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={userData.password} 
                        onChange={e => setUserData({...userData, password: e.target.value})}
                        placeholder={editingUserId ? "Leave blank to keep current" : "Create password"}
                        required={!editingUserId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={userData.role} onChange={e => setUserData({...userData, role: e.target.value as Role})}>
                      {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  
                  {editingUserId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={userData.status} onChange={e => setUserData({...userData, status: e.target.value as any})}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                  )}

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} value={userData.address} onChange={e => setUserData({...userData, address: e.target.value})} />
                  </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};