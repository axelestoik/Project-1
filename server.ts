
console.log('--- SERVER STARTING ---');

import express, { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createRepository } from './core/db/repository.ts';
import { JurisdictionManager } from './core/jurisdiction/JurisdictionManager.ts';
import { authService } from './core/auth/authService.ts';
import { db } from './core/db/drizzle-db.ts';
import { 
  organizations, jurisdictions, branches, properties, 
  transactions, maintenanceTasks, invoices, quotes, 
  recurringInvoices, payments, leases, notifications, auditLogs,
  users, memberships, invitations, platformInvitationsV2, managerLimits, roles, permissions, rolePermissions
} from './core/db/drizzle-schema.ts';
import { eq, sql, and, ne } from 'drizzle-orm';
import { 
  initialJurisdictions, initialBranches, initialProperties,
  initialTransactions, initialTasks, initialInvoices,
  initialQuotes, initialRecurringInvoices, initialPayments, initialLeases,
  getInitialUsers, initialMemberships
} from './core/db/seed.ts';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

// Legacy interface (keeping it but transitioning some routes)
interface AuthInfo {
  orgId: string;
  branches: string[];
  role: string;
  platformRole?: string;
}

interface LegacyAuthenticatedRequest extends express.Request {
  auth?: AuthInfo;
  activeBranchId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repo?: any;
  user?: { userId: string; email: string; platformRole?: string };
}

// Notification helper
async function addNotification(userId: string, title: string, message: string, type: 'Info' | 'Alert' | 'ActionRequired' = 'Info', organizationId?: string) {
  try {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId,
      organizationId,
      title,
      message,
      type,
      isRead: '0',
      createdAt: new Date(),
    });
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
}

// Audit Log helper
async function addAuditLog(userId: string, action: string, details: Record<string, unknown>, organizationId?: string, entityId?: string, entityType?: string) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId,
      organizationId,
      action,
      entityId,
      entityType,
      details,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error('Failed to create audit log:', e);
  }
}

// Permission check helper
async function checkPermission(userId: string, organizationId: string, permissionKey: string): Promise<boolean> {
  const membership = await db.query.memberships.findFirst({
    where: sql`${memberships.userId} = ${userId} AND ${memberships.organizationId} = ${organizationId}`
  });
  if (!membership) return false;

  const role = await db.query.roles.findFirst({
    where: sql`${roles.name} = ${membership.role} AND ${roles.organizationId} = ${organizationId}`
  });
  if (!role) return false;

  const perm = await db.query.permissions.findFirst({
    where: eq(permissions.name, permissionKey)
  });
  if (!perm) return false;

  const rolePerm = await db.query.rolePermissions.findFirst({
    where: sql`${rolePermissions.roleId} = ${role.id} AND ${rolePermissions.permissionId} = ${perm.id}`
  });
  
  return !!rolePerm;
}

// Permission middleware
const permissionMiddleware = (permissionKey: string) => async (req: LegacyAuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const organizationId = req.auth?.orgId;
  
  if (!userId || !organizationId || !(await checkPermission(userId, organizationId, permissionKey))) {
    if (userId && organizationId) {
       await addAuditLog(userId, 'BLOCKED_ACCESS', { permissionKey, path: req.path }, organizationId);
    }
    return res.status(403).json({ 
      error: 'Permission denied', 
      message: `You do not have the required permissions (${permissionKey}) to perform this action. Please contact your administrator.` 
    });
  }
  next();
};

// Global RBAC Middleware protecting all /api endpoints except /auth and /ping and /health
const rbacMiddleware = async (req: LegacyAuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/auth') || req.path === '/api/ping' || req.path === '/api/health') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await addAuditLog('anonymous', 'BLOCKED_ACCESS', { path: req.path });
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = authService.verifyToken(token);
    req.user = decoded;
  } catch (err) {
    await addAuditLog('unknown', 'BLOCKED_ACCESS', { path: req.path });
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }

  // Exception for creating an organization
  if (req.path === '/api/organizations' && req.method === 'POST') {
    return next();
  }

  // User verified, now get requested orgId
  const requestedOrgId = req.headers['x-org-id'] as string;
  if (!requestedOrgId) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing x-org-id header' });
  }

  // Verify membership and Role
  const userMemberships = await db.query.memberships.findMany({
    where: eq(memberships.userId, decoded.userId)
  });

  const membership = userMemberships.find(m => m.organizationId === requestedOrgId);
  let activeRole = membership?.role;
  let activeBranches = (membership?.branchIds as string[]) || [];

  // Superadmin override
  if (decoded.platformRole === 'PlatformAdmin') {
    activeRole = 'Admin'; // Fallback mapping for legacy endpoints
    activeBranches = [];
  } else if (!activeRole) {
    await addAuditLog(decoded.userId, 'BLOCKED_ACCESS', { path: req.path, requestedOrgId }, requestedOrgId);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have access to this organization. Please ensure you are logged in with the correct account.' 
    });
  }

  req.auth = {
    orgId: requestedOrgId,
    branches: activeBranches,
    role: activeRole,
    platformRole: decoded.platformRole
  };

  next();
};

const branchScopingMiddleware = (req: LegacyAuthenticatedRequest, res: Response, next: NextFunction) => {
  const branchId = req.headers['x-branch-id'] as string;
  const { auth } = req;

  if (branchId && auth) {
    if (!auth.branches.includes(branchId) && auth.role !== 'Admin') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'User not assigned to this branch' 
      });
    }
  }

  if (auth) {
    req.activeBranchId = branchId || null;
    req.repo = createRepository(auth.orgId, req.activeBranchId);
  }
  next();
};

async function seedDatabase() {
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, 'org-01')
  });
  
  if (!existingOrg) {
    console.log('Seeding database with initial data...');
    try {
      await db.insert(organizations).values([
        { id: 'org-01', name: 'Elite Realty Group' },
        { id: 'org-02', name: 'Nexus Property Management' }
      ]);

      const initialUsers = await getInitialUsers();
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(users).values(initialUsers);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(memberships).values(initialMemberships);

      // @ts-expect-error - Relaxed types for seeding
      await db.insert(jurisdictions).values(initialJurisdictions);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(branches).values(initialBranches);
      await db.insert(properties).values(initialProperties);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(transactions).values(initialTransactions);
      await db.insert(maintenanceTasks).values(initialTasks);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(invoices).values(initialInvoices);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(quotes).values(initialQuotes);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(recurringInvoices).values(initialRecurringInvoices);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(payments).values(initialPayments);
      // @ts-expect-error - Relaxed types for seeding
      await db.insert(leases).values(initialLeases);
      console.log('Database seeded successfully');
    } catch (e) {
      console.error('Seed partially failed:', e);
    }
  }
}

async function syncSchema() {
  if (!process.env.DB_HOST) return;
  console.log('[Database] Syncing schema...');
  try {
    // Manual fix for organizations table
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type text DEFAULT 'LLC';`);
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address text;`);
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email text;`);
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone text;`);
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';`);
    
    // Update existing rows
    await db.execute(sql`UPDATE organizations SET type = 'LLC' WHERE type IS NULL;`);
    await db.execute(sql`UPDATE organizations SET status = 'Active' WHERE status IS NULL;`);

    // Fix for roles table
    await db.execute(sql`ALTER TABLE roles DROP COLUMN IF EXISTS organization_id;`);
    await db.execute(sql`ALTER TABLE roles DROP COLUMN IF EXISTS hierarchy_level;`);
    await db.execute(sql`ALTER TABLE roles ADD COLUMN IF NOT EXISTS organization_id text;`);
    await db.execute(sql`ALTER TABLE roles ADD COLUMN IF NOT EXISTS hierarchy_level numeric DEFAULT '0' NOT NULL;`);

    // Fix for users table
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'PendingApproval';`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason text;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_role text DEFAULT 'None';`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();`);

    // Backfill names if they were missing (optional, but good for stability)
    await db.execute(sql`UPDATE users SET first_name = 'User' WHERE first_name IS NULL;`);
    await db.execute(sql`UPDATE users SET last_name = 'Name' WHERE last_name IS NULL;`);
    
    // Ensure PlatformAdmins and initial seed users are Active
    await db.execute(sql`UPDATE users SET status = 'Active' WHERE platform_role = 'PlatformAdmin' OR id IN ('user-01', 'user-02', 'user-admin');`);

    // Fix for memberships table
    await db.execute(sql`ALTER TABLE memberships DROP COLUMN IF EXISTS created_by;`);
    await db.execute(sql`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';`);
    await db.execute(sql`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS assigned_by text;`);
    await db.execute(sql`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();`);
    await db.execute(sql`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();`);
    await db.execute(sql`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS branch_ids text DEFAULT '[]';`);

    // Backfill memberships status
    await db.execute(sql`UPDATE memberships SET status = 'Active' WHERE status IS NULL;`);
    await db.execute(sql`UPDATE memberships SET branch_ids = '[]' WHERE branch_ids IS NULL;`);

    // Create manager_limits if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS manager_limits (
        id text PRIMARY KEY,
        user_id text NOT NULL UNIQUE REFERENCES users(id),
        max_organizations numeric DEFAULT '1' NOT NULL,
        max_users numeric DEFAULT '10' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Ensure other potentially missing tables exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_invitations_v2 (
        id text PRIMARY KEY,
        email text NOT NULL,
        platform_role text NOT NULL,
        token text NOT NULL,
        expires_at timestamp NOT NULL,
        max_users numeric NOT NULL,
        max_storage_bytes numeric,
        created_at timestamp DEFAULT now() NOT NULL,
        created_by text NOT NULL,
        status text DEFAULT 'Pending' NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text,
        organization_id text REFERENCES organizations(id),
        hierarchy_level numeric DEFAULT '0' NOT NULL,
        is_system numeric DEFAULT '0' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id text PRIMARY KEY,
        name text NOT NULL UNIQUE,
        description text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id text NOT NULL REFERENCES roles(id),
        permission_id text NOT NULL REFERENCES permissions(id),
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id),
        organization_id text REFERENCES organizations(id),
        title text NOT NULL,
        message text NOT NULL,
        type text DEFAULT 'Info' NOT NULL,
        is_read numeric DEFAULT '0' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id text PRIMARY KEY,
        user_id text REFERENCES users(id),
        organization_id text REFERENCES organizations(id),
        action text NOT NULL,
        entity_type text,
        entity_id text,
        details jsonb,
        ip_address text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS branch_assignments (
        user_id text NOT NULL REFERENCES users(id),
        branch_id text NOT NULL REFERENCES branches(id),
        assigned_at timestamp DEFAULT now() NOT NULL
      );
    `);

    const { stdout } = await execAsync('npx drizzle-kit push --force');
    console.log('[Database] Schema sync output:', stdout);
  } catch (err: unknown) {
    const error = err as Error & { stderr?: string };
    console.error('[Database] Schema sync failed:', error.message);
  }
}

async function startServer() {
  
const app = express();
  const PORT = 3000;

  let vite: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Verify we have DB config available
  const { DB_HOST, DB_USER, DB_NAME } = process.env;
  if (DB_HOST && DB_USER && DB_NAME) {
    console.log('[Startup] Independent variables found for Database');
  }

  app.use(express.json());

  // Health check for platform
  app.get('/healthz', (req, res) => res.send('ok'));

  // Log all non-asset requests
  app.use((req, res, next) => {
    if (!req.path.includes('.')) {
      console.log(`[Request] ${req.method} ${req.path}`);
    }
    next();
  });

  app.get('/api/ping', (req, res) => res.send('pong'));

  app.get('/api/health', async (req, res) => {
    let diagnostics = null;
    if (process.env.DB_HOST) {
      try {
        diagnostics = { host: process.env.DB_HOST, database: process.env.DB_NAME, hasSsl: process.env.DB_SSL === 'true' };
      } catch {
        diagnostics = { error: 'Invalid config' };
      }
    }
    
    try {
      if (process.env.DB_HOST) {
        // Attempt an actual db check
        try {
          await db.execute(sql`SELECT 1`);
        } catch (dbErr) {
          return res.status(503).json({ status: 'error', message: (dbErr as Error).message, diagnostics });
        }
      }
      res.json({ status: 'ok', database: 'connected', diagnostics });
    } catch (e) {
      res.status(503).json({ status: 'error', message: (e as Error).message, diagnostics });
    }
  });

  // Auth & API Routes
  app.post('/api/auth/login', async (req, res) => {
    try { res.json(await authService.login(req.body)); } 
    catch (e) { res.status(401).json({ error: (e as Error).message }); }
  });

  app.get('/api/properties', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getProperties());
  });
  
  app.get('/api/transactions', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getTransactions());
  });

  app.get('/api/tasks', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getTasks());
  });

  app.get('/api/invoices', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getInvoices());
  });

  app.get('/api/quotes', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getQuotes());
  });

  app.get('/api/recurring-invoices', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getRecurringInvoices());
  });

  app.get('/api/payments', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getPayments());
  });

  app.get('/api/leases', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getLeases());
  });

  app.get('/api/branches', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    res.json(await req.repo.getBranches());
  });

  app.get('/api/jurisdiction-config', rbacMiddleware, branchScopingMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    try {
      const jur = await req.repo.getJurisdictionForActiveBranch();
      res.json(JurisdictionManager.getConfig(jur));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Invitations API (Admin Only)
  app.post('/api/invitations', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can invite users' });
    }
    const { email, role, createOrganization } = req.body;
    
    if (role === 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin' && req.auth?.role !== 'SystemSuperAdmin') {
       return res.status(403).json({ error: 'Forbidden', message: 'You cannot invite a SystemSuperAdmin' });
    }

    try {
      if (createOrganization && role === 'Admin') {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 86400000 * 7); // 7 days
        const newInvite = {
          id: crypto.randomUUID(),
          email,
          platformRole: 'None' as const,
          token,
          expiresAt,
          maxUsers: '10', // Default limits
          createdBy: req.user!.userId,
          status: 'Pending' as const,
        };
        await db.insert(platformInvitationsV2).values(newInvite);
        await addAuditLog(req.user!.userId, 'PLATFORM_INVITATION_CREATED', { email, role: 'None' }, req.auth.orgId, newInvite.id, 'platform_invitations_v2');
        return res.status(201).json(newInvite);
      }

      const token = Math.random().toString(36).substr(2, 24);
      const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days
      
      const newInvite = {
        id: crypto.randomUUID(),
        organizationId: req.auth.orgId,
        email,
        role,
        token,
        expiresAt,
        createdBy: req.user!.userId,
        status: 'Pending' as const,
      };

      await db.insert(invitations).values(newInvite);
      await addNotification(req.user!.userId, 'Invitation Created', `Invitation sent to ${email}`, 'Info', req.auth.orgId);
      res.status(201).json(newInvite);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/invitations', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can view invitations' });
    }
    try {
      let conditions = [eq(invitations.organizationId, req.auth.orgId)];
      if (req.auth?.platformRole !== 'PlatformAdmin' && req.auth?.role !== 'SystemSuperAdmin') {
        conditions.push(ne(invitations.role, 'SystemSuperAdmin'));
      }
      
      const pendingInvites = await db.query.invitations.findMany({
        where: and(...conditions)
      });
      res.json(pendingInvites);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Platform Invitations API (Platform Admin Only)
  app.post('/api/platform/invitations', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only Platform Admins can invite organizations' });
    }
    const { email, role, maxUsers, maxStorageBytes } = req.body;
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 86400000 * 7); // 7 days

      const newInvite = {
        id: crypto.randomUUID(),
        email,
        platformRole: role,
        token,
        expiresAt,
        maxUsers,
        maxStorageBytes,
        createdBy: req.user!.userId,
        status: 'Pending' as const,
      };

      await db.insert(platformInvitationsV2).values(newInvite);
      res.status(201).json(newInvite);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/platform/invitations/validate/:token', async (req: express.Request, res: express.Response) => {
    try {
      const token = typeof req.params.token === 'string' ? req.params.token : req.params.token[0];
      const invite = await db.query.platformInvitationsV2.findFirst({
        where: eq(platformInvitationsV2.token, token)
      });

      if (!invite) return res.status(404).json({ error: 'Invitation not found', message: 'We could not find this invitation. It may have been deleted.' });
      if (invite.status !== 'Pending') return res.status(400).json({ error: 'Invitation already used', message: 'This invitation has already been accepted or cancelled.' });
      if (new Date(invite.expiresAt) < new Date()) {
        await db.update(platformInvitationsV2).set({ status: 'Expired' }).where(eq(platformInvitationsV2.id, invite.id));
        return res.status(400).json({ error: 'Invitation expired', message: 'This invitation has expired. Please request a new one from your administrator.' });
      }

      res.json({ email: invite.email });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/platform/register', async (req: express.Request, res: express.Response) => {
    try {
      const { token, email, password, firstName, lastName } = req.body;
      
      const invite = await db.query.platformInvitationsV2.findFirst({
        where: eq(platformInvitationsV2.token, token)
      });
      if (!invite || invite.status !== 'Pending' || new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Invalid invitation', message: 'This invitation is invalid or has expired.' });
      }
      
      if (invite.email !== email) {
        return res.status(400).json({ error: 'Email mismatch', message: 'This invitation was sent to a different email address. Please use the email address associated with the invitation.' });
      }

      const pwHash = await bcrypt.hash(password, 10);
      const newUserId = crypto.randomUUID();

      await db.insert(users).values({
        id: newUserId,
        email,
        passwordHash: pwHash,
        firstName,
        lastName,
        organizationId: undefined, // Will be set after approval
        platformRole: invite.platformRole,
        status: 'PendingApproval',
      });

      await db.update(platformInvitationsV2).set({ status: 'Accepted' }).where(eq(platformInvitationsV2.id, invite.id));
      await addAuditLog(newUserId, 'REGISTER_COMPLETE', { email }, undefined, newUserId, 'user');
      
      // Notify Admin
      const platformAdmin = await db.query.users.findFirst({ where: eq(users.platformRole, 'PlatformAdmin') });
      if (platformAdmin) {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: platformAdmin.id,
          title: 'New Platform Registration',
          message: `User ${email} has registered and is pending approval.`,
          type: 'ActionRequired',
          isRead: '0',
          createdAt: new Date(),
        });
      }

      res.status(201).json({ success: true, message: 'Registration pending approval' });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/platform/users/pending', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    try {
      const pendingUsers = await db.query.users.findMany({
        where: eq(users.status, 'PendingApproval')
      });
      res.json(pendingUsers);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/platform/users/:id/approve', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.platformRole !== 'PlatformAdmin') return res.status(403).json({ error: 'Forbidden' });
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    try {
      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const orgId = crypto.randomUUID();
      await db.insert(organizations).values({ id: orgId, name: `${user.firstName}'s Org` });
      await db.update(users).set({ status: 'Active', organizationId: orgId }).where(eq(users.id, id));
      await db.insert(memberships).values({ userId: id, organizationId: orgId, role: 'Owner', status: 'Active', assignedBy: req.user!.userId, createdAt: new Date(), updatedAt: new Date() });
      await addNotification(id, 'Account Approved', 'Your account has been approved and organization created.', 'Info', orgId);
      await db.insert(auditLogs).values({ id: crypto.randomUUID(), userId: req.user!.userId, action: 'ApproveUser', entityId: id, createdAt: new Date() });
      
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/platform/users/:id/reject', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.platformRole !== 'PlatformAdmin') return res.status(403).json({ error: 'Forbidden' });
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { reason } = req.body;
    try {
      await db.update(users).set({ status: 'Inactive', rejectionReason: reason }).where(eq(users.id, id));
      await addNotification(id, 'Account Rejected', `Your account has been rejected. Reason: ${reason}`, 'Alert');
      await db.insert(auditLogs).values({ id: crypto.randomUUID(), userId: req.user!.userId, action: 'RejectUser', entityId: id, details: { reason }, createdAt: new Date() });
      
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/users', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can view users' });
    }
    try {
      let conditions = [eq(memberships.organizationId, req.auth!.orgId)];
      if (req.auth?.platformRole !== 'PlatformAdmin' && req.auth?.role !== 'SystemSuperAdmin') {
        conditions.push(ne(users.platformRole, 'PlatformAdmin'));
        conditions.push(ne(memberships.role, 'SystemSuperAdmin'));
      }

      const orgUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        platformRole: users.platformRole,
        status: users.status,
        role: memberships.role
      })
      .from(users)
      .innerJoin(memberships, eq(users.id, memberships.userId))
      .where(and(...conditions));
      
      res.json(orgUsers);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Roles API
  app.post('/api/roles', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    try {
      const { name, level, description } = req.body;
      const organizationId = req.auth?.orgId;
      if (!organizationId) return res.status(403).json({ error: 'No organization selected' });
      
      if (!name || level === undefined) return res.status(400).json({ error: 'Missing name or level' });

      // Get requester role
      const requesterMembership = await db.query.memberships.findFirst({
        where: sql`${memberships.userId} = ${req.user!.userId} AND ${memberships.organizationId} = ${organizationId}`
      });
      const requesterRole = await db.query.roles.findFirst({
        where: sql`${roles.name} = ${requesterMembership?.role} AND ${roles.organizationId} = ${organizationId}`
      });
      const requesterLevel = parseInt(requesterRole?.hierarchyLevel || '0' , 10);
      const newLevel = parseInt(level, 10);

      if (newLevel >= requesterLevel) {
        return res.status(403).json({ error: 'Forbidden', message: 'Role level must be lower than your own' });
      }

      await db.insert(roles).values({
        id: crypto.randomUUID(),
        name,
        hierarchyLevel: newLevel.toString(),
        description,
        organizationId,
        isSystem: '0'
      });
      await addAuditLog(req.user!.userId, 'CREATE_ROLE', { name, level: newLevel }, organizationId, undefined, 'role');

      res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/notifications', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    try {
      const userNotifications = await db.query.notifications.findMany({
        where: and(
            eq(notifications.userId, req.user!.userId),
            eq(notifications.organizationId, req.auth!.orgId)
        ),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)]
      });
      res.json(userNotifications);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Role Permissions API
  app.post('/api/role-permissions', rbacMiddleware, permissionMiddleware('org:manage_roles'), async (req: LegacyAuthenticatedRequest, res) => {
    try {
      const { roleId, permissionId } = req.body;
      const organizationId = req.auth?.orgId;

      // Verify that role belongs to org
      const role = await db.query.roles.findFirst({
        where: sql`${roles.id} = ${roleId} AND ${roles.organizationId} = ${organizationId}`
      });
      if (!role) return res.status(404).json({ error: 'Role not found in this organization' });
      
      await db.insert(rolePermissions).values({ roleId, permissionId });
      await addNotification(req.user!.userId, 'Permission Changed', `Permission ${permissionId} assigned to role ${roleId}`, 'Info', organizationId);

      // Audit Log
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: req.user!.userId,
        organizationId,
        action: 'ASSIGN_PERMISSION',
        entityType: 'role_permission',
        details: { roleId, permissionId }
      });

      res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Organizations API
  app.post('/api/organizations', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    const { name, type, address, contactEmail, phone } = req.body;
    try {
      // Check limit
      const managerLimit = await db.query.managerLimits.findFirst({ 
        where: eq(managerLimits.userId, req.user!.userId as string) 
      });
      const maxOrgs = parseInt(managerLimit?.maxOrganizations?.toString() || '1', 10);
      const currentOrgs = await db.select({ count: sql<number>`count(*)` }).from(memberships).where(eq(memberships.userId, req.user!.userId));
      
      if (currentOrgs[0].count >= maxOrgs) {
        await addNotification(req.user!.userId, 'Limit Reached', 'You have reached the maximum number of organizations', 'Alert');
        return res.status(403).json({ 
          error: 'Limit reached', 
          message: `Your account level allows a maximum of ${maxOrgs} organizations. Please upgrade your plan to create more.` 
        });
      }

      const orgId = crypto.randomUUID();
      await db.insert(organizations).values({ id: orgId, name, type, address, contactEmail, phone, status: 'Active' });
      await db.insert(memberships).values({ userId: req.user!.userId, organizationId: orgId, role: 'Admin', status: 'Active', assignedBy: req.user!.userId, createdAt: new Date(), updatedAt: new Date() });
      await db.insert(auditLogs).values({ id: crypto.randomUUID(), userId: req.user!.userId, action: 'CreateOrganization', entityId: orgId, createdAt: new Date() });
      await addNotification(req.user!.userId, 'Organization Created', `Organization ${name} created`, 'Info', orgId);

      res.status(201).json({ id: orgId });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/organizations', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    try {
      let orgsList;
      if (req.auth?.platformRole === 'PlatformAdmin') {
        orgsList = await db.query.organizations.findMany();
      } else {
        const userMemberships = await db.query.memberships.findMany({ where: eq(memberships.userId, req.user!.userId) });
        const orgIds = userMemberships.map(m => m.organizationId);
        orgsList = await db.query.organizations.findMany({ where: sql`${organizations.id} IN (${sql.join(orgIds.map(id => sql`${id}`), sql`,`)})` });
      }
      res.json(orgsList);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/memberships', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can add members' });
    }
    try {
      const { userId, role } = req.body;
      const organizationId = req.auth!.orgId;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      const existingMembership = await db.query.memberships.findFirst({
        where: sql`${memberships.userId} = ${userId} AND ${memberships.organizationId} = ${organizationId}`
      });

      if (existingMembership) {
        return res.status(400).json({ error: 'User is already a member of this organization' });
      }
      
      await db.insert(memberships).values({
        userId,
        organizationId,
        role: role || 'Staff',
        branchIds: [],
        status: 'Active',
        assignedBy: req.user!.userId
      });
      await addNotification(userId, 'Assigned to Organization', `You have been assigned to organization ${organizationId}`, 'Info', organizationId);
      await addAuditLog(req.user!.userId, 'ASSIGN_USER_TO_ORG', { userId, role: role || 'Staff' }, organizationId, userId, 'membership');

      res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/users', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can add users' });
    }
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (role === 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin' && req.auth?.role !== 'SystemSuperAdmin') {
         return res.status(403).json({ error: 'Forbidden', message: 'You cannot create a user with SystemSuperAdmin role.' });
      }
      
      // Check limit
      const managerLimit = await db.query.managerLimits.findFirst({ 
        where: eq(managerLimits.userId, req.user!.userId as string) 
      });
      const maxUsers = parseInt(managerLimit?.maxUsers?.toString() || '10', 10);
      
      const currentUsersCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(memberships)
        .where(eq(memberships.assignedBy, req.user!.userId));
        
      if (currentUsersCountResult[0].count >= maxUsers) {
        await addNotification(req.user!.userId, 'Limit Reached', 'You have reached the maximum number of users', 'Alert', req.auth.orgId);
        return res.status(403).json({ 
          error: 'Limit reached', 
          message: `Your organization level allows a maximum of ${maxUsers} users. Please upgrade your plan to add more members.` 
        });
      }
      
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'User already exists', 
          message: 'An account with this email address already exists. Please use a different email or sign in to the existing account.' 
        });
      }

      const pwHash = await bcrypt.hash(password, 10);
      const newUserId = crypto.randomUUID();

      await db.insert(users).values({
        id: newUserId,
        email,
        passwordHash: pwHash,
        firstName,
        lastName,
        organizationId: req.auth.orgId,
      });

      await db.insert(memberships).values({
        userId: newUserId,
        organizationId: req.auth.orgId,
        role: role || 'Staff',
        branchIds: [],
        status: 'Active',
        assignedBy: req.user?.userId || 'system'
      });
      await addAuditLog(req.user!.userId, 'CREATE_USER', { email, role: role || 'Staff' }, req.auth.orgId, newUserId, 'user');

      res.status(201).json({ id: newUserId, email, firstName, lastName, role });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/users/:userId/approve', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can approve users' });
    }
    try {
      const userId = req.params.userId as string;
      
      // Verify user is in the org
      const membership = await db.query.memberships.findFirst({
        where: and(eq(memberships.userId, userId), eq(memberships.organizationId, req.auth!.orgId))
      });

      if (!membership) {
        return res.status(404).json({ error: 'User not found in organization' });
      }

      await db.update(users).set({ status: 'Active' }).where(eq(users.id, userId));
      await addAuditLog(req.user!.userId, 'APPROVE_USER', {}, req.auth!.orgId, userId, 'user');
      
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.put('/api/users/:userId', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can edit users' });
    }
    try {
      const { firstName, lastName, role } = req.body;
      const { userId } = req.params;

      if (role === 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin' && req.auth?.role !== 'SystemSuperAdmin') {
         return res.status(403).json({ error: 'Forbidden', message: 'You cannot assign SystemSuperAdmin role.' });
      }

      await db.update(users).set({ firstName, lastName }).where(eq(users.id, userId as string));
      await addAuditLog(req.user!.userId, 'UPDATE_USER', { firstName, lastName }, req.auth.orgId, userId as string, 'user');
      
      if (role) {
        await db.update(memberships)
          .set({ role })
          .where(and(eq(memberships.userId, userId as string), eq(memberships.organizationId, req.auth.orgId)));
        await addNotification(userId as string, 'Role Changed', `Your role in organization ${req.auth.orgId} has been updated`, 'Info', req.auth.orgId);
        await addAuditLog(req.user!.userId, 'CHANGE_USER_ROLE', { role }, req.auth.orgId, userId as string, 'membership');
      }

      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.delete('/api/memberships/:userId', rbacMiddleware, async (req: LegacyAuthenticatedRequest, res) => {
    if (req.auth?.role !== 'Admin' && req.auth?.role !== 'SystemSuperAdmin' && req.auth?.platformRole !== 'PlatformAdmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can remove members' });
    }
    try {
      await db.delete(memberships).where(
        and(eq(memberships.userId, req.params.userId as string), eq(memberships.organizationId, req.auth.orgId))
      );
      await addAuditLog(req.user!.userId, 'REMOVE_MEMBER_FROM_ORG', { userId: req.params.userId as string }, req.auth.orgId, req.params.userId as string, 'membership');
      res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Accept Invitation & Registration API
  app.get('/api/invitations/validate/:token', async (req: express.Request, res: express.Response) => {
    try {
      const token = typeof req.params.token === 'string' ? req.params.token : req.params.token[0];
      const invite = await db.query.invitations.findFirst({
        where: eq(invitations.token, token)
      });

      if (!invite) return res.status(404).json({ error: 'Invitation not found', message: 'We could not find this invitation. It may have been deleted.' });
      if (invite.status !== 'Pending') return res.status(400).json({ error: 'Invitation already used', message: 'This invitation has already been accepted or cancelled.' });
      if (new Date(invite.expiresAt) < new Date()) {
        await db.update(invitations).set({ status: 'Expired' }).where(eq(invitations.id, invite.id));
        return res.status(400).json({ error: 'Invitation expired', message: 'This invitation has expired. Please request a new one from your administrator.' });
      }

      res.json({ email: invite.email });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/invitations/accept', async (req: express.Request, res: express.Response) => {
    const { token, email, password, firstName, lastName, userId: providedUserId } = req.body;
    
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
      const invite = await db.query.invitations.findFirst({
        where: eq(invitations.token, token)
      });

      if (!invite) return res.status(404).json({ error: 'Invitation not found', message: 'We could not find this invitation. It may have been deleted.' });
      if (invite.status !== 'Pending') return res.status(400).json({ error: 'Invitation already used', message: 'This invitation has already been accepted or cancelled.' });
      
      if (new Date(invite.expiresAt) < new Date()) {
        await db.update(invitations).set({ status: 'Expired' }).where(eq(invitations.id, invite.id));
        return res.status(400).json({ error: 'Invitation expired', message: 'This invitation has expired. Please request a new one from your administrator.' });
      }

      let targetUserId = providedUserId;

      // If it's a registration flow (no userId, but registration data provided)
      if (!targetUserId && password && firstName && lastName) {
        if (invite.email !== email) {
          return res.status(400).json({ error: 'Email mismatch', message: 'This invitation was sent to a different email address.' });
        }

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, email)
        });

        if (existingUser) {
          targetUserId = existingUser.id;
          // Update user if they were not active
          if (existingUser.status !== 'Active') {
            const pwHash = await bcrypt.hash(password, 10);
            await db.update(users).set({
              passwordHash: pwHash,
              firstName,
              lastName,
              status: 'Active'
            }).where(eq(users.id, targetUserId));
          }
        } else {
          const pwHash = await bcrypt.hash(password, 10);
          targetUserId = crypto.randomUUID();
          
          await db.insert(users).values({
            id: targetUserId,
            email,
            passwordHash: pwHash,
            firstName,
            lastName,
            status: 'Active', // Auto-activate invited users
            platformRole: 'None',
            createdAt: new Date(),
          });
        }
      }

      if (!targetUserId) {
        return res.status(400).json({ error: 'Missing registration details or userId' });
      }

      const user = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });
      if (user && user.email !== invite.email) {
        return res.status(400).json({ 
          error: 'Email mismatch', 
          message: `This invitation was sent to ${invite.email}, but you are using ${user.email}.` 
        });
      }

      // Check for existing membership
      const existingMembership = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.userId, targetUserId),
          eq(memberships.organizationId, invite.organizationId)
        )
      });

      if (!existingMembership) {
        // Add user to membership
        await db.insert(memberships).values({
          userId: targetUserId,
          organizationId: invite.organizationId,
          role: invite.role,
          status: 'Active',
          assignedBy: 'system',
          branchIds: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        await db.update(memberships).set({
          status: 'Active',
          role: invite.role,
          updatedAt: new Date()
        }).where(and(
          eq(memberships.userId, targetUserId),
          eq(memberships.organizationId, invite.organizationId)
        ));
      }

      // Mark invite as used
      await db.update(invitations).set({ status: 'Accepted' }).where(eq(invitations.id, invite.id));

      res.status(200).json({ success: true, userId: targetUserId });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // API 404
  app.all('/api/*all', (req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  // Frontend Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom',
      root: process.cwd(),
    });
    app.use(vite.middlewares);
    
    app.get('*all', async (req, res, next) => {
      // For browser requests that are not for static assets or API, serve index.html
      if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
      }
      
      try {
        const url = req.originalUrl;
        const templatePath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(templatePath)) {
          return res.status(404).send('index.html not found');
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        if (vite) (vite as any).ssrFixStacktrace(e as Error); // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('[Server] Vite transform error:', e);
        next(e);
      }
    });
    console.log('[Server] Vite middleware integrated with manual SPA fallback');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('[Server] Static serving enabled (Production)');
    } else {
      console.error('[Server] dist directory not found - have you run npm run build?');
      app.get('*all', (req, res) => res.status(500).send('Production build missing. Please build the application.'));
    }
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('[Critical Error]', err);
    res.status(500).json({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    if (process.env.DB_HOST) {
       syncSchema().then(() => seedDatabase()).catch(console.error);
    } else {
       console.log('[Database] Skipping sync - no DB credentials provided');
    }
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'default-secret-key';
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { startServer };
