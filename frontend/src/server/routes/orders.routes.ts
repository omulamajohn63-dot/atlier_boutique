import { Router, Request, Response, NextFunction } from 'express';
import { orderCreateSchema, orderNumberParamSchema } from '../schemas/order.schema';
import { OrderService } from '../services/order.service';

const router = Router();

/**
 * POST /api/orders
 * Consumes authoritative cart, verifies & decrements stock, creates order.
 */
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = orderCreateSchema.parse(req.body);
    const order = OrderService.createOrder(req.cartId, validated);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:orderNumber
 * Authoritative order details and fulfillment tracking.
 */
router.get('/:orderNumber', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = orderNumberParamSchema.parse(req.params);
    const order = OrderService.getOrderByNumber(orderNumber);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:orderNumber/cancel
 * Cancels pending order and restocks inventory.
 */
router.post('/:orderNumber/cancel', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = orderNumberParamSchema.parse(req.params);
    const cancelled = OrderService.cancelOrder(orderNumber);
    res.json(cancelled);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:orderNumber/receive
 * Marks a delivered order as received by the customer.
 */
router.post('/:orderNumber/receive', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = orderNumberParamSchema.parse(req.params);
    const received = OrderService.receiveOrder(orderNumber);
    res.json(received);
  } catch (err) {
    next(err);
  }
});

export const ordersRouter = router;
