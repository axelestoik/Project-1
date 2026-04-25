
import express, { Response, NextFunction } from 'express';
import path from 'path';
// import { createServer as createViteServer } from 'vite'; (Moved to dynamic import)
import { createRepository } from './core/db/repository.ts';
import { JurisdictionManager } from './core/jurisdiction/JurisdictionManager.ts';
import { initialJurisdictions } from './core/db/seed.ts';

import { verifyToken, AuthenticatedRequest } from './core/auth/middleware.ts';
import { authService } from './core/auth/authService.ts';

// Shared types for request augmentation (Legacy)
interface AuthInfo {
  orgId: string;
  branches: string[];
  role: string;
}

// Legacy interface (keeping it but transitioning some routes)
interface LegacyAuthenticatedRequest extends express.Request {
  auth?: AuthInfo;
  activeBranchId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repo?: any;
}

// Mock Auth Middleware for testing (Legacy)
const mockAuth = (req: LegacyAuthenticatedRequest, res: Response, next: NextFunction) => {
  // Simulator: In a real app, this comes from JWT/Session
  const userId = req.headers['x-user-id'] || 'user-02'; // Default to Branch Manager
  
  // Hardcoded mapping for demonstration in test
  const memberships: Record<string, AuthInfo> = {
    'user-01': { orgId: 'org-01', branches: ['br-ca-01', 'br-on-01'], role: 'Admin' },
    'user-02': { orgId: 'org-01', branches: ['br-ca-01'], role: 'Staff' }
  };

  req.auth = memberships[userId as string];
  if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const branchScopingMiddleware = (req: LegacyAuthenticatedRequest, res: Response, next: NextFunction) => {
  const branchId = req.headers['x-branch-id'] as string;
  const { auth } = req;

  if (branchId && auth) {
    // 3. Access Control Check
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

import { db } from './core/db/drizzle-db.ts';
import { organizations } from './core/db/drizzle-schema.ts';
import { eq } from 'drizzle-orm';

async function seedOrganizations() {
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, 'org-01')
  });
  
  if (!existingOrg) {
    await db.insert(organizations).values([
      { id: 'org-01', name: 'Elite Realty Group' },
      { id: 'org-02', name: 'Nexus Property Management' }
    ]);
    console.log('Seeded initial organizations');
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  await seedOrganizations();

  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const user = await authService.signUp(req.body);
      res.status(201).json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(401).json({ error: message });
    }
  });

  // Protected Routes Example
  app.get('/api/dashboard', verifyToken, (req: AuthenticatedRequest, res: Response) => {
    const { user } = req;
    res.json({
      message: `Welcome ${user?.email}`,
      data: {
        userId: user?.userId,
        email: user?.email,
        orgId: user?.orgId,
      }
    });
  });

  // Legacy API Routes
  app.get('/api/properties', mockAuth, branchScopingMiddleware, (req: LegacyAuthenticatedRequest, res: Response) => {
    const data = req.repo.getProperties();
    res.json(data);
  });

  app.get('/api/jurisdiction-config', mockAuth, branchScopingMiddleware, (req: LegacyAuthenticatedRequest, res: Response) => {
    const jur = req.repo.getJurisdictionForActiveBranch();
    const config = JurisdictionManager.getConfig(jur);
    res.json(config);
  });

  app.post('/api/branches', mockAuth, (req, res) => {
    const { name, jurisdictionId } = req.body;
    
    // Verification: Valid jurisdiction provided
    const jurExists = initialJurisdictions.some(j => j.id === jurisdictionId);
    if (!jurExists) {
      return res.status(400).json({ error: 'Valid jurisdiction ID is required' });
    }

    res.status(201).json({ id: 'new-br', name });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }

  return app;
}

export { startServer };

// Check if run directly
if (process.env.NODE_ENV !== 'test') {
  // Fallback for JWT_SECRET to prevent startup issues
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'lot202-default-secret-change-this-in-production';
  }
  
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}
