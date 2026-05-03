
import { pgTable, text, timestamp, numeric, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['SoleProprietor', 'LLC', 'Corporation', 'Partnership'] }).default('LLC').notNull(),
  address: text('address'),
  contactEmail: text('contact_email'),
  phone: text('phone'),
  status: text('status', { enum: ['Active', 'Inactive'] }).default('Active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  organizationId: text('organization_id')
    .references(() => organizations.id),
  platformRole: text('platform_role', { enum: ['PlatformAdmin', 'None'] }).default('None').notNull(),
  status: text('status', { enum: ['Active', 'Inactive', 'PendingApproval'] }).default('PendingApproval').notNull(),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

export const jurisdictions = pgTable('jurisdictions', {
  id: text('id').primaryKey(),
  countryCode: text('country_code').notNull(),
  regionCode: text('region_code').notNull(),
  configOverrides: jsonb('config_overrides').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  jurisdictionId: text('jurisdiction_id')
    .notNull()
    .references(() => jurisdictions.id),
  name: text('name').notNull(),
  status: text('status', { enum: ['active', 'inactive', 'deleted'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const properties = pgTable('properties', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  name: text('name').notNull(),
  address: text('address').notNull(),
  type: text('type', { enum: ['House', 'Apartment', 'Commercial'] }).notNull(),
  status: text('status', { enum: ['Occupied', 'Available', 'Maintenance'] }).notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  date: text('date').notNull(), // Using text to match frontend expectation or ISO format
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category', { enum: ['Rent', 'Maintenance', 'Utilities', 'Taxes', 'Other'] }).notNull(),
  type: text('type', { enum: ['Income', 'Expense'] }).notNull(),
});

export const maintenanceTasks = pgTable('maintenance_tasks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority', { enum: ['Low', 'Medium', 'High'] }).notNull(),
  status: text('status', { enum: [
    'Identified', 'Assessing', 'Quote', 'Tech Review', 'Approved by Tech',
    'Owner Review', 'Approved by Owner', 'Shop Materials', 'Coordinate',
    'Scheduled', 'Complete'
  ] }).notNull(),
  dueDate: text('due_date').notNull(),
  assessmentDate: text('assessment_date'),
  scheduledDate: text('scheduled_date'),
});

export const branchAssignments = pgTable('branch_assignments', {
  userId: text('user_id').notNull().references(() => users.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  userId: text('user_id').notNull().references(() => users.id),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  role: text('role').notNull(), // role type check handled in app logic or enum here
  status: text('status', { enum: ['Active', 'Inactive'] }).default('Active').notNull(),
  assignedBy: text('assigned_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  branchIds: jsonb('branch_ids').default([]).notNull(),
}, (table) => ({
  uniqMembership: uniqueIndex('uniq_membership_idx').on(table.userId, table.organizationId),
}));

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role').notNull(),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by').notNull(),
  status: text('status', { enum: ['Pending', 'Accepted', 'Expired'] }).notNull(),
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  tenantName: text('tenant_name').notNull(),
  date: text('date').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status', { enum: ['Paid', 'Pending', 'Overdue'] }).notNull(),
  items: jsonb('items').notNull(),
});

export const quotes = pgTable('quotes', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  clientName: text('client_name').notNull(),
  date: text('date').notNull(),
  expiryDate: text('expiry_date').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status', { enum: ['Draft', 'Sent', 'Accepted', 'Declined'] }).notNull(),
  items: jsonb('items').notNull(),
});

export const recurringInvoices = pgTable('recurring_invoices', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  tenantName: text('tenant_name').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: text('frequency', { enum: ['Monthly', 'Quarterly', 'Yearly'] }).notNull(),
  nextDate: text('next_date').notNull(),
  status: text('status', { enum: ['Active', 'Paused'] }).notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  invoiceId: text('invoice_id').references(() => invoices.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  date: text('date').notNull(),
  method: text('method', { enum: ['Transfer', 'Cash', 'Card', 'Check'] }).notNull(),
  reference: text('reference').notNull(),
});

export const leases = pgTable('leases', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  branchId: text('branch_id')
    .notNull()
    .references(() => branches.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  tenantName: text('tenant_name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).notNull(),
  securityDeposit: numeric('security_deposit', { precision: 10, scale: 2 }).notNull(),
  status: text('status', { enum: ['Active', 'Expiring', 'Terminated', 'Pending'] }).notNull(),
});

export const platformInvitationsV2 = pgTable('platform_invitations_v2', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  platformRole: text('platform_role', { enum: ['PlatformAdmin', 'None'] }).notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  maxUsers: numeric('max_users').notNull(),
  maxStorageBytes: numeric('max_storage_bytes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by').notNull(),
  status: text('status', { enum: ['Pending', 'Accepted', 'Expired', 'Cancelled'] }).default('Pending').notNull(),
});

export const managerLimits = pgTable('manager_limits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id),
  maxOrganizations: numeric('max_organizations').default('1').notNull(),
  maxUsers: numeric('max_users').default('10').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: text('organization_id').references(() => organizations.id), // Nullable for system roles
  hierarchyLevel: numeric('hierarchy_level').default('0').notNull(),
  isSystem: numeric('is_system').default('0').notNull(), // 1 for system roles, 0 for custom
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqRoleNameOrg: uniqueIndex('uniq_role_name_org_idx').on(table.name, table.organizationId),
}));

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g. 'org:write_data'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqRolePerm: uniqueIndex('uniq_role_perm_idx').on(table.roleId, table.permissionId),
}));

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  organizationId: text('organization_id').references(() => organizations.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['Info', 'Alert', 'ActionRequired'] }).default('Info').notNull(),
  isRead: numeric('is_read').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  organizationId: text('organization_id').references(() => organizations.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
