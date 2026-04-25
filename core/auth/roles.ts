
export const USER_ROLES = {
  SystemSuperAdmin: 'SystemSuperAdmin',
  Admin: 'Admin',
  Staff: 'Staff',
  Tenant: 'Tenant',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
