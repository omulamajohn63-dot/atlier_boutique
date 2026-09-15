import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      cartId: string;
      userId?: string;
    }
  }
}

export function cartSessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check header, cookies, or query
  const headerCartId = req.headers['x-cart-id'] as string | undefined;
  const cookieCartId = req.cookies?.cart_id as string | undefined;

  let resolvedCartId = headerCartId?.trim() || cookieCartId?.trim();

  // If provided, verify the cart exists in DB, otherwise or if none provided create one
  if (resolvedCartId) {
    const existing = db.getCartById(resolvedCartId);
    if (!existing) {
      // Create new cart with this id or fresh id
      db.createCart(resolvedCartId);
    }
  } else {
    const newCart = db.createCart();
    resolvedCartId = newCart.id;
  }

  req.cartId = resolvedCartId;

  // Set response header and cookie for client tracking
  res.setHeader('x-cart-id', resolvedCartId);
  res.cookie('cart_id', resolvedCartId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  next();
}
