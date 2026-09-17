import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { config, isSupabaseConfigured } from '../config';
import { getSupabaseAdminClient } from '../supabase';

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authorization Bearer token required for administrative operations.'));
    return;
  }

  const token = authHeader.split(' ')[1];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await getSupabaseAdminClient().auth.getUser(token);
      const role = data.user?.app_metadata?.role || data.user?.user_metadata?.role;
      if (error || !data.user || !['staff', 'admin'].includes(String(role))) {
        next(new UnauthorizedError('Invalid or unauthorized staff credentials.'));
        return;
      }
      res.locals.authenticatedUser = data.user;
      next();
      return;
    } catch {
      next(new UnauthorizedError('Unable to verify staff credentials.'));
      return;
    }
  }

  const localTokens = config.NODE_ENV === 'production' || !process.env.ADMIN_API_TOKEN
    ? []
    : [process.env.ADMIN_API_TOKEN];

  if (!localTokens.includes(token)) {
    next(new UnauthorizedError('Invalid or expired administrative credentials.'));
    return;
  }

  res.locals.authenticatedUser = { id: 'local-development-admin', role: 'admin' };
  next();
}
