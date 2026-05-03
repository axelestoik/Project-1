
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
    const savedMemberships = localStorage.getItem('memberships');
    const savedOrgs = localStorage.getItem('organizations');
    
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setToken(savedToken);
      setActiveOrgId(parsedUser.organizationId);
      
      if (savedMemberships) {
        setMemberships(JSON.parse(savedMemberships));
      } else {
        setMemberships([{
          userId: parsedUser.id,
          organizationId: parsedUser.organizationId,
          role: USER_ROLES.Admin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'Active',
          assignedBy: 'system',
          branchIds: []
        }]);
      }
      
      if (savedOrgs) {
        setOrganizations(JSON.parse(savedOrgs));
      } else {
        setOrganizations([{
          id: parsedUser.organizationId,
          name: 'My Organization',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]);
      }
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
    
    if (data.memberships) {
      setMemberships(data.memberships);
      localStorage.setItem('memberships', JSON.stringify(data.memberships));
    }
    if (data.organizations) {
      setOrganizations(data.organizations);
      localStorage.setItem('organizations', JSON.stringify(data.organizations));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveOrgId(null);
    setMemberships([]);
    setOrganizations([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('memberships');
    localStorage.removeItem('organizations');
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
