import { Router, Request, Response, NextFunction } from 'express';
import { cartItemCreateSchema, cartItemUpdateSchema, cartItemIdParamSchema } from '../schemas/cart.schema';
import { CartService } from '../services/cart.service';

const router = Router();

/**
 * GET /api/cart
 * Returns authoritative cart contents, item quantities, line totals, and subtotal.
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = CartService.getCart(req.cartId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cart/items
 * Adds a variant to the cart with server-side inventory and availability checks.
 */
router.post('/items', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = cartItemCreateSchema.parse(req.body);
    const updatedCart = CartService.addItem(req.cartId, body.variantId, body.quantity);
    res.status(201).json(updatedCart);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/cart/items/:itemId
 * Updates item quantity with stock validation and cart ownership verification.
 */
router.patch('/items/:itemId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = cartItemIdParamSchema.parse(req.params);
    const { quantity } = cartItemUpdateSchema.parse(req.body);
    const updatedCart = CartService.updateItem(req.cartId, itemId, quantity);
    res.json(updatedCart);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cart/items/:itemId
 * Removes an item from the cart after verifying ownership.
 */
router.delete('/items/:itemId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = cartItemIdParamSchema.parse(req.params);
    const updatedCart = CartService.removeItem(req.cartId, itemId);
    res.json(updatedCart);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cart
 * Clears the user's cart.
 */
router.delete('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedCart = CartService.clearCart(req.cartId);
    res.json(updatedCart);
  } catch (err) {
    next(err);
  }
});

export const cartRouter = router;
