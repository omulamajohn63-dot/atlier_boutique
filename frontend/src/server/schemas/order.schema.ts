import { z } from 'zod';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Valid email address required'),
  phone: z
    .string()
    .trim()
    .min(9, 'Phone number must be at least 9 characters')
    .max(20, 'Phone number too long'),
  addressLine1: z.string().trim().min(3, 'Address line 1 is required'),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  county: z.string().trim().min(2, 'County is required'),
  postalCode: z.string().trim().optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
});

export const orderCreateSchema = z.object({
  customer: shippingAddressSchema,
  shippingMethod: z.enum(['standard', 'express']).default('standard'),
  paymentMethod: z.enum(['mpesa', 'card', 'cash_on_delivery', 'pay_on_delivery']).default('mpesa'),
  notes: z.string().trim().max(500).optional(),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderNumberParamSchema = z.object({
  orderNumber: z.string().trim().min(3, 'Order number must be at least 3 characters'),
});
