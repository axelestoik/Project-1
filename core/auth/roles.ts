
export const USER_ROLES = {
  // Platform-level roles
  PlatformAdmin: 'PlatformAdmin',
  
  // Organization-level roles
  OrganizationManager: 'OrganizationManager',
  OrganizationUser: 'OrganizationUser',

  // Legacy roles (to keep existing functionality working)
  SystemSuperAdmin: 'SystemSuperAdmin',
  Admin: 'Admin',
  Staff: 'Staff',
  Tenant: 'Tenant',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Base permission structure for RBAC
export type Permission = 
  | 'platform:manage_orgs'
  | 'platform:manage_users'
  | 'org:manage_settings'
  | 'org:manage_users'
  | 'org:read_data'
  | 'org:write_data';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.PlatformAdmin]: [
    'platform:manage_orgs',
    'platform:manage_users',
    'org:manage_settings',
    'org:manage_users',
    'org:read_data',
    'org:write_data',
  ],
  [USER_ROLES.OrganizationManager]: [
    'org:manage_settings',
    'org:manage_users',
    'org:read_data',
    'org:write_data',
  ],
  [USER_ROLES.OrganizationUser]: [
    'org:read_data',
    'org:write_data',
  ],
  // Legacy mappings
  [USER_ROLES.SystemSuperAdmin]: ['platform:manage_orgs', 'platform:manage_users', 'org:manage_settings', 'org:manage_users', 'org:read_data', 'org:write_data'],
  [USER_ROLES.Admin]: ['org:manage_settings', 'org:manage_users', 'org:read_data', 'org:write_data'],
  [USER_ROLES.Staff]: ['org:read_data', 'org:write_data'],
  [USER_ROLES.Tenant]: ['org:read_data'],
};

