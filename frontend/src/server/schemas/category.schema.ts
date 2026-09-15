import { z } from 'zod';

export const categorySlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Category slug is required')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  isActive: z.boolean().default(true),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
