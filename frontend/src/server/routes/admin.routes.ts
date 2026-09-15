import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminAuth } from '../middleware/auth.middleware';
import { productCreateSchema, productUpdateSchema, productIdParamSchema } from '../schemas/product.schema';
import { categoryCreateSchema } from '../schemas/category.schema';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { db } from '../db/database';
import { OrderService } from '../services/order.service';

const router = Router();

// Protect all admin routes with authentication
router.use(requireAdminAuth);

/**
 * POST /api/admin/products
 */
router.post('/products', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = productCreateSchema.parse(req.body);
    const product = ProductService.createProduct(validated);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/products/:id
 */
router.patch('/products/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = productIdParamSchema.parse(req.params);
    const validated = productUpdateSchema.parse(req.body);
    const updated = ProductService.updateProduct(id, validated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/products/:id/archive
 */
router.post('/products/:id/archive', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = productIdParamSchema.parse(req.params);
    const archived = ProductService.archiveProduct(id);
    res.json(archived);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/categories
 */
router.post('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = categoryCreateSchema.parse(req.body);
    const category = CategoryService.createCategory(validated);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/reset-database (Utility for automated tests and sandbox maintenance)
 */
router.post('/reset-database', (req: Request, res: Response) => {
  db.seed();
  res.json({ status: 'ok', message: 'Database reset to initial seed state.' });
});

/**
 * POST /api/admin/maintenance/expire-reservations
 * Releases unpaid stock reservations whose checkout window has elapsed.
 */
router.post('/maintenance/expire-reservations', (req: Request, res: Response, next: NextFunction) => {
  try {
    const expired = OrderService.expireReservations();
    res.json({ expired });
  } catch (err) {
    next(err);
  }
});

export const adminRouter = router;
