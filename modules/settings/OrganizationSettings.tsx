
import React, { useState } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { USER_ROLES, UserRole } from '@/core/auth/roles';
import { Invitation } from '@/core/db/schema';

const OrganizationSettings: React.FC = () => {
  const { activeOrganization, activeRole, memberships } = useAuth();
  const [invites, setInvites] = useState<Invitation[]>([]); // Mock invite state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.Staff);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !activeOrganization) return;

    const newInvite: Invitation = {
      id: Math.random().toString(36).substr(2, 9),
      organizationId: activeOrganization.id,
      email,
      role,
      token: Math.random().toString(36).substr(2, 24),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
      createdBy: 'admin-01',
      status: 'Pending',
    };

    setInvites([...invites, newInvite]);
    setEmail('');
    alert(`Invitation sent to ${email} as ${role}`);
  };

  if (!activeOrganization) return null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Organization Profile</h3>
          <p className="text-slate-400 text-sm font-medium">Manage your organization details and members.</p>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none mb-1">Current Organization</span>
          <span className="text-lg font-black text-[#87a3a3]">{activeOrganization.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Member List */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            Team Members
            <span className="bg-slate-100 text-slate-400 text-[10px] py-0.5 px-2 rounded-full uppercase tracking-widest">{memberships.length} active</span>
          </h4>
          <div className="space-y-4">
            {memberships.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:border-[#87a3a350]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#87a3a3] text-white flex items-center justify-center font-black text-xs uppercase">{m.userId.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{m.userId}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role}</p>
                  </div>
                </div>
                {activeRole === USER_ROLES.Admin && m.role !== USER_ROLES.Admin && (
                   <button className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-500">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite User */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-6">Invite New Member</h4>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 ml-1">Email Address</label>
              <input 
                id="invite-email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-semibold rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 ml-1">Assign Role</label>
              <select 
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-semibold rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
              >
                <option value={USER_ROLES.Staff}>Staff</option>
                <option value={USER_ROLES.Admin}>Admin</option>
                <option value={USER_ROLES.Tenant}>Tenant</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#87a3a3] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#769191] transition-all shadow-lg shadow-[#87a3a320]"
            >
              Send Invitation
            </button>
          </form>

          {invites.length > 0 && (
            <div className="mt-8">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Pending Invitations</h5>
              <div className="space-y-2">
                {invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <span className="text-xs font-bold text-slate-600">{invite.email}</span>
                    <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest leading-none bg-white px-2 py-1 rounded-md border border-yellow-200">
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
