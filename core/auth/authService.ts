
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/drizzle-db.ts';
import { users, organizations, memberships } from '../db/drizzle-schema.ts';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';

// Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('JWT_SECRET is not defined in environment variables. Auth features will be insecure.');
}

/**
 * Service for user authentication and management
 */
export const authService = {
  /**
   * Validates credentials and returns a signed JWT
   */
  async login(data: z.infer<typeof loginSchema>) {
    const validated = loginSchema.parse(data);

    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'PendingApproval') {
      throw new Error('Your account is pending approval by an administrator');
    }

    if (user.status === 'Inactive') {
      const reason = user.rejectionReason ? `: ${user.rejectionReason}` : '';
      throw new Error(`Your account has been rejected or suspended${reason}`);
    }

    if (!JWT_SECRET) {
      throw new Error('Server configuration error: JWT_SECRET missing');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      orgId: user.organizationId,
      platformRole: user.platformRole,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    let userMemberships = await db.query.memberships.findMany({
      where: eq(memberships.userId, user.id)
    });

    let userOrgs = await db.query.organizations.findMany({
      where: userMemberships.length > 0 ? inArray(organizations.id, userMemberships.map(m => m.organizationId)) : (user.organizationId ? eq(organizations.id, user.organizationId) : undefined)
    });

    if (user.platformRole === 'PlatformAdmin') {
      userOrgs = await db.query.organizations.findMany();
      userMemberships = userOrgs.map(org => ({
        userId: user.id,
        organizationId: org.id,
        role: 'Admin', // Translate PlatformAdmin permissions for frontend fallback
        branchIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'Active',
        assignedBy: 'system'
      }));
    } else if (userMemberships.length === 0 && user.organizationId) {
       // if they have no explicit memberships but have an orgId, assume Admin/Staff there
       userMemberships = [{
         userId: user.id,
         organizationId: user.organizationId,
         role: 'Admin', // default to admin for mock or simple auth
         branchIds: [],
         createdAt: new Date(),
         updatedAt: new Date(),
         status: 'Active',
         assignedBy: 'system'
       }];
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
      },
      memberships: userMemberships,
      organizations: userOrgs,
    };
  },

  /**
   * Verifies a JWT and returns the decoded payload
   */
  verifyToken(token: string) {
    if (!JWT_SECRET) {
      throw new Error('Server configuration error: JWT_SECRET missing');
    }
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      orgId: string;
      platformRole: string;
    };
  },
};
