import { z } from 'zod';

export const productSortEnum = z.enum(['price_asc', 'price_desc', 'newest', 'name']);
export type ProductSortOption = z.infer<typeof productSortEnum>;

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
  sort: productSortEnum.default('newest'),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const productIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Product ID or slug is required'),
});

export const productBaseSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  tagline: z.string().trim().max(255).optional(),
  details: z.array(z.string().trim()).optional(),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  compareAtPrice: z.number().min(0).optional(),
  categoryId: z.string().trim().min(1, 'Category ID is required'),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  images: z.array(z.string().url()).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

export const productCreateSchema = productBaseSchema.refine(
  (data) => {
    if (data.compareAtPrice !== undefined && data.compareAtPrice !== null) {
      return data.compareAtPrice > data.price;
    }
    return true;
  },
  {
    message: 'compareAtPrice must be strictly greater than current price',
    path: ['compareAtPrice'],
  }
);

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productBaseSchema.partial().refine(
  (data) => {
    if (data.price !== undefined && data.compareAtPrice !== undefined && data.compareAtPrice !== null) {
      return data.compareAtPrice > data.price;
    }
    return true;
  },
  {
    message: 'compareAtPrice must be strictly greater than current price',
    path: ['compareAtPrice'],
  }
);
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
