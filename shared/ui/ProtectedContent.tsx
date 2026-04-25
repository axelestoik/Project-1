
import React, { ReactNode } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { UserRole } from '@/core/auth/roles';

interface ProtectedContentProps {
  roles: UserRole[];
  children: ReactNode;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({ roles, children }) => {
  const { activeRole } = useAuth();

  if (!activeRole || !roles.includes(activeRole)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedContent;
