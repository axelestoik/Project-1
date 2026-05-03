import { db } from '../core/db/drizzle-db.js';
import * as schema from '../core/db/drizzle-schema.js';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function cleanDb() {
  console.log('Cleaning database...');
  
  // Truncate tables cascade
  await db.execute(sql`TRUNCATE TABLE 
    users, 
    organizations, 
    jurisdictions, 
    branches, 
    properties, 
    transactions, 
    maintenance_tasks, 
    branch_assignments, 
    memberships, 
    invitations, 
    invoices, 
    quotes, 
    recurring_invoices, 
    payments, 
    leases 
    CASCADE`);

  console.log('Database cleaned.');

  console.log('Creating Admin User...');

  const orgId = 'org-01';
  const adminId = 'user-admin';
  const branchId = 'br-ca-01';

  // Create Org
  await db.insert(schema.organizations).values({
    id: orgId,
    name: 'Lot 202 Operations',
  });

  // Create Jurisdiction
  await db.insert(schema.jurisdictions).values({
    id: 'jur-usa-ca',
    countryCode: 'US',
    regionCode: 'CA',
    configOverrides: { taxRate: 0.08, mandatoryInspection: true },
  });

  // Create Branch
  await db.insert(schema.branches).values({
    id: branchId,
    organizationId: orgId,
    jurisdictionId: 'jur-usa-ca',
    name: 'Main Branch',
    status: 'active',
  });

  const pwHash = await bcrypt.hash('Admin2026!', 10);
  
  // Create User
  await db.insert(schema.users).values({
    id: adminId,
    email: 'admin@lot202.com',
    passwordHash: pwHash,
    firstName: 'System',
    lastName: 'Admin',
    organizationId: orgId,
    platformRole: 'PlatformAdmin',
  });

  // Create Membership (Admin)
  await db.insert(schema.memberships).values({
    userId: adminId,
    organizationId: orgId,
    role: 'Admin',
    branchIds: [branchId],
    status: 'Active',
    assignedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Admin user created successfully.');
  console.log('Credentials:');
  console.log('Email: admin@lot202.com');
  console.log('Password: Admin2026!');
  
  process.exit(0);
}

cleanDb().catch(e => {
  console.error(e);
  process.exit(1);
});
