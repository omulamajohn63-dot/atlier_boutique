import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderNumber: z.string().trim().min(3, 'Order number is required'),
  method: z.enum(['mpesa', 'card']).default('mpesa'),
  phoneNumber: z.string().trim().optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().trim().min(1, 'Payment Intent ID is required'),
  orderNumber: z.string().trim().min(3, 'Order number is required'),
  gatewayReference: z.string().trim().optional(),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

export const paymentWebhookSchema = z.object({
  event: z.string().min(1, 'Webhook event is required'),
  data: z.object({
    paymentIntentId: z.string().optional(),
    orderNumber: z.string().optional(),
    status: z.enum(['succeeded', 'failed']).optional(),
    transactionId: z.string().optional(),
    amount: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;

export const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string().min(1),
      CheckoutRequestID: z.string().min(1),
      ResultCode: z.number().int(),
      ResultDesc: z.string().optional(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});

export type MpesaCallbackInput = z.infer<typeof mpesaCallbackSchema>;
