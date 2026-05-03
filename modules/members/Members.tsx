import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { USER_ROLES } from '@/core/auth/roles';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

const Members: React.FC = () => {
  const { token, activeOrganization, activeRole } = useAuth();
  const isAdmin = activeRole === USER_ROLES.Admin || activeRole === USER_ROLES.SystemSuperAdmin || activeRole === USER_ROLES.PlatformAdmin;
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Staff'
  });

  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationRole, setInvitationRole] = useState('Staff');
  const [createOrganization, setCreateOrganization] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': activeOrganization?.id || ''
        }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeOrganization) fetchUsers();
  }, [token, activeOrganization]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'Staff' });
    setShowForm(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setFormMode('edit');
    setEditingUserId(user.id);
    setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = formMode === 'add' ? '/api/users' : `/api/users/${editingUserId}`;
      const method = formMode === 'add' ? 'POST' : 'PUT';
      
      const payload: Record<string, string> = { ...formData };
      if (formMode === 'edit') {
        // don't send password if unchanged in edit, or maybe we don't support password change here
        delete payload.password;
        delete payload.email; // assuming email can't change
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-org-id': activeOrganization?.id || ''
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save user');
      }
      
      setShowForm(false);
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-org-id': activeOrganization?.id || ''
        },
        body: JSON.stringify({
          email: invitationEmail,
          role: invitationRole,
          createOrganization: invitationRole === 'Admin' ? createOrganization : false
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || 'Failed to send invitation');
      }

      const data = await res.json();
      const link = `${window.location.origin}/register?token=${data.token}`;
      setInvitationLink(link);
      setInvitationEmail('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/memberships/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': activeOrganization?.id || ''
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete member');
      }
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': activeOrganization?.id || ''
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to approve member');
      }
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) return <div className="p-10 animate-pulse">{t('members.loading') || 'Loading members...'}</div>;
  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">{t('members.title') || 'Members'}</h2>
          <p className="text-slate-400 font-medium">{t('members.subtitle') || 'Manage organization users and roles.'}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-4">
            <button 
              onClick={handleOpenAdd}
              className="px-6 py-3 bg-[#87a3a3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#87a3a330] hover:bg-[#769191] transition-all"
            >
              {t('members.add_member') || 'Add New Member'}
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-white text-[#87a3a3] border-2 border-[#87a3a3] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              {t('members.invite_member') || 'Invite Member'}
            </button>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Invite Member</h3>
                <p className="text-sm text-slate-400 font-medium">Send an invitation link to join this organization.</p>
              </div>
              <button onClick={() => { setShowInviteModal(false); setInvitationLink(null); }} className="text-slate-300 hover:text-slate-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {!invitationLink ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label htmlFor="invitationEmail" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 px-1">Email Address</label>
                  <input 
                    id="invitationEmail"
                    required 
                    type="email" 
                    value={invitationEmail} 
                    onChange={e => setInvitationEmail(e.target.value)} 
                    placeholder="colleague@company.com"
                    className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]" 
                  />
                </div>
                <div>
                  <label htmlFor="invitationRole" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 px-1">Role</label>
                  <select 
                    id="invitationRole"
                    value={invitationRole} 
                    onChange={e => setInvitationRole(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>
                {invitationRole === 'Admin' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="createOrganization" 
                      checked={createOrganization} 
                      onChange={(e) => setCreateOrganization(e.target.checked)} 
                      className="w-4 h-4 text-[#87a3a3] border-slate-300 rounded focus:ring-[#87a3a3]"
                    />
                    <label htmlFor="createOrganization" className="text-sm text-slate-600 font-medium">
                      Require user to create their own organization on login
                    </label>
                  </div>
                )}
                <button type="submit" className="w-full px-6 py-4 bg-[#87a3a3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#87a3a330] hover:bg-[#769191] transition-all">
                  Generate Invitation Link
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-scaleIn">
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Invitation link successfully generated!
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="copyLink" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">Copy this link:</label>
                  <div className="flex gap-2">
                    <input 
                      id="copyLink"
                      readOnly 
                      type="text" 
                      value={invitationLink} 
                      className="flex-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-mono font-medium rounded-xl px-4 py-3 focus:outline-none" 
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(invitationLink);
                        alert('Link copied to clipboard!');
                      }}
                      className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowInviteModal(false); setInvitationLink(null); }}
                  className="w-full px-6 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-4">{formMode === 'add' ? (t('members.add_title') || 'Add Member') : (t('members.edit_title') || 'Edit Member')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 px-1">{t('members.first_name') || 'First Name'}</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 px-1">{t('members.last_name') || 'Last Name'}</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]" />
              </div>
            </div>
            {formMode === 'add' && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 px-1">{t('members.email') || 'Email'}</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 px-1">{t('members.password') || 'Password'}</label>
                  <input required minLength={6} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]" />
                </div>
              </>
            )}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 px-1">{t('members.role') || 'Role'}</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]">
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Tenant">Tenant</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">{t('members.cancel') || 'Cancel'}</button>
              <button type="submit" className="px-6 py-2 bg-[#87a3a3] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#769191]">{formMode === 'add' ? (t('members.save') || 'Save Member') : (t('members.update') || 'Update Member')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {users.map(u => (
            <li key={u.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 font-black flex items-center justify-center text-lg shadow-inner">
                  {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{u.firstName} {u.lastName}</h4>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-widest">
                  {u.role}
                </span>
                {u.status === 'PendingApproval' && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold uppercase tracking-widest">
                    {t('members.pending') || 'Pending'}
                  </span>
                )}
                {isAdmin && (
                  <>
                    {u.status === 'PendingApproval' && (
                      <button 
                        onClick={() => handleApprove(u.id)}
                        className="text-xs font-black text-green-600 hover:text-green-700 hover:bg-green-50 uppercase tracking-widest border border-green-200 rounded-xl px-4 py-2 transition-colors"
                      >
                        {t('members.approve') || 'Approve'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenEdit(u)}
                      className="text-xs font-black text-[#87a3a3] hover:text-[#5a6e6e] uppercase tracking-widest border border-[#87a3a330] rounded-xl px-4 py-2 transition-colors"
                    >
                      {t('members.edit') || 'Edit'}
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title={t('members.delete') || 'Delete'}
                      aria-label={t('members.delete') || 'Delete'}
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Members;
