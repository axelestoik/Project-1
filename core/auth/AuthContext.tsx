
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserRole, USER_ROLES } from './roles';
import { Organization, Membership } from '@/core/db/schema';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeOrganization: Organization | null;
  activeRole: UserRole | null;
  activeBranchId: string | null;
  memberships: Membership[];
  organizations: Organization[];
  login: (credentials: Record<string, string>) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  switchOrganization: (orgId: string) => void;
  switchBranch: (branchId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Effect to load user from token on mount
  React.useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setToken(savedToken);
      setActiveOrgId(parsedUser.organizationId);
      // In a real app we'd fetch memberships here
      // For now we'll mock them based on the user's org
      setMemberships([{
        userId: parsedUser.id,
        organizationId: parsedUser.organizationId,
        role: USER_ROLES.Admin, // Default for new signups in this demo
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        branchIds: []
      }]);
      setOrganizations([{
        id: parsedUser.organizationId,
        name: 'My Organization',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
    }
  }, []);

  const activeMembership = memberships.find(m => m.organizationId === activeOrgId);
  const activeOrganization = organizations.find(org => org.id === activeOrgId) || null;
  const activeRole = activeMembership?.role || null;

  const login = async (credentials: Record<string, string>) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    
    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    setActiveOrgId(data.user.organizationId);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Refresh memberships (mocked for now)
    setMemberships([{
      userId: data.user.id,
      organizationId: data.user.organizationId,
      role: USER_ROLES.Admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      branchIds: []
    }]);
    setOrganizations([{
      id: data.user.organizationId,
      name: 'Default Org',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]);
  };

  const register = async (data: Record<string, string>) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    
    // Auto login after registration
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const switchOrganization = (orgId: string) => {
    if (memberships.some(m => m.organizationId === orgId)) {
      setActiveOrgId(orgId);
      setActiveBranchId(null);
    }
  };

  const switchBranch = (branchId: string | null) => {
    if (!branchId) {
      setActiveBranchId(null);
      return;
    }

    const isAssigned = activeMembership?.branchIds?.includes(branchId) || activeRole === USER_ROLES.Admin;
    
    if (isAssigned) {
      setActiveBranchId(branchId);
    } else {
      console.error('Forbidden - User not assigned to this branch');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      activeOrganization, 
      activeRole,
      activeBranchId,
      memberships, 
      organizations,
      login,
      register,
      logout,
      switchOrganization,
      switchBranch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
