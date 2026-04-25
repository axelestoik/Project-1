
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/drizzle-db.ts';
import { users, organizations } from '../db/drizzle-schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Validation Schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

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
   * Creates a new user with a hashed password
   */
  async signUp(data: z.infer<typeof signUpSchema>) {
    const validated = signUpSchema.parse(data);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Verify organization exists
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, validated.organizationId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(validated.password, saltRounds);

    const newUser = {
      id: crypto.randomUUID(),
      email: validated.email,
      passwordHash,
      firstName: validated.firstName,
      lastName: validated.lastName,
      organizationId: validated.organizationId,
    };

    await db.insert(users).values(newUser);

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      organizationId: newUser.organizationId,
    };
  },

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

    if (!JWT_SECRET) {
      throw new Error('Server configuration error: JWT_SECRET missing');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      orgId: user.organizationId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
      },
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
    };
  },
};
