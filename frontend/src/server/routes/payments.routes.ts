import { Router, Request, Response, NextFunction } from 'express';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  paymentWebhookSchema,
  mpesaCallbackSchema,
} from '../schemas/payment.schema';
import { PaymentService } from '../services/payment.service';
import { config } from '../config';

const router = Router();

/**
 * POST /api/payments/mpesa/callback
 * Receives the Daraja STK callback and reconciles the correlated payment intent.
 */
router.post('/mpesa/callback', (req: Request, res: Response, next: NextFunction) => {
  try {
    const callbackToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    if (callbackToken !== config.MPESA_CALLBACK_SECRET) {
      res.status(401).json({ ResponseCode: '1', ResponseDescription: 'Unauthorized callback.' });
      return;
    }

    const validated = mpesaCallbackSchema.parse(req.body);
    const result = PaymentService.processMpesaCallback(validated);
    res.json({ ResponseCode: '0', ResponseDescription: 'Accepted', ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/create-intent
 * Generates an authoritative payment intent bound to the order total.
 */
router.post('/create-intent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createPaymentIntentSchema.parse(req.body);
    const intent = await PaymentService.createIntent(validated);
    res.status(201).json(intent);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/confirm
 * Confirms payment intent and transitions order to paid.
 */
router.post('/confirm', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = confirmPaymentSchema.parse(req.body);
    const order = PaymentService.confirmPayment(validated);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook
 * Secure webhook receiver for payment gateways with cryptographic signature verification.
 */
router.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature =
      (req.headers['x-webhook-signature'] as string) ||
      (req.headers['x-webhook-secret'] as string);

    const validated = paymentWebhookSchema.parse(req.body);
    const result = PaymentService.processWebhook(validated, signature);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export const paymentsRouter = router;
