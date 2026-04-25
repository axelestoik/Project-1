
import { Request, Response, NextFunction } from 'express';
import { authService } from './authService.ts';

/**
 * Interface for the user payload stored in the JWT
 */
export interface UserPayload {
  userId: string;
  email: string;
  orgId: string;
}

/**
 * Extension of the Express Request object to include the authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

/**
 * Middleware to verify the JWT token from the Authorization header
 */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing or invalid',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = authService.verifyToken(token) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token expired or invalid',
    });
  }
};
