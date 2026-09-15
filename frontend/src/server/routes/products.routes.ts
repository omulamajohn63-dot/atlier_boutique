import { Router, Request, Response, NextFunction } from 'express';
import { productQuerySchema, productIdParamSchema } from '../schemas/product.schema';
import { ProductService } from '../services/product.service';

const router = Router();

/**
 * GET /api/products
 * Public list of products with pagination, filtering, and sorting.
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = productQuerySchema.parse(req.query);
    const result = ProductService.getProducts(validatedQuery);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id
 * Retrieve a single active product by ID or slug.
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = productIdParamSchema.parse(req.params);
    const product = ProductService.getProductByIdOrSlug(id, true);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export const productsRouter = router;
