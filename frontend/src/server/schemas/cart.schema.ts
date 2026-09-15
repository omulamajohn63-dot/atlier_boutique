import { z } from 'zod';

export const cartItemCreateSchema = z.object({
  variantId: z.string().trim().min(1, 'variantId is required and must not be empty'),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').max(50, 'Max 50 items per line allowed'),
});

export type CartItemCreateInput = z.infer<typeof cartItemCreateSchema>;

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').max(50, 'Max 50 items per line allowed'),
});

export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;

export const cartItemIdParamSchema = z.object({
  itemId: z.string().trim().min(1, 'itemId is required'),
});
