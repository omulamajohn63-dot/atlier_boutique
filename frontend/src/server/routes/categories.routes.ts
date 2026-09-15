import { Router, Request, Response, NextFunction } from 'express';
import { categorySlugParamSchema } from '../schemas/category.schema';
import { CategoryService } from '../services/category.service';

const router = Router();

/**
 * GET /api/categories
 * Returns active categories for the public storefront.
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = CategoryService.getCategories(false);
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/categories/:slug
 * Returns category details and its active products.
 */
router.get('/:slug', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = categorySlugParamSchema.parse(req.params);
    const result = CategoryService.getCategoryWithProducts(slug);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export const categoriesRouter = router;
