import { db } from '../db/database';
import { OrderEntity, OrderItemEntity } from '../db/types';
import { OrderDTO, OrderItemDTO } from '../types/api';
import { OrderCreateInput } from '../schemas/order.schema';
import { AppError, NotFoundError, ConflictError } from '../errors/app-error';
import { PricingService } from './pricing.service';

export class OrderService {
  /**
   * Authoritatively creates an order from the active cart session,
  * performs atomic stock verification, creates active stock reservations,
  * decrements available inventory, and clears the cart.
   */
  public static createOrder(cartId: string, input: OrderCreateInput): OrderDTO {
    return db.transaction(() => {
      this.expireReservations();
      const rawItems = db.getCartItems(cartId);

      if (!rawItems || rawItems.length === 0) {
        throw new AppError(400, 'EMPTY_CART', 'Cannot place an order with an empty cart.');
      }

      // 1. Concurrency Stock Validation Pass
      for (const item of rawItems) {
        const variant = db.getVariantById(item.variantId);
        if (!variant) {
          throw new NotFoundError('Variant', item.variantId);
        }

        const product = db.getProductById(item.productId);
        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(
            400,
            'PRODUCT_UNAVAILABLE',
            `Product for item ${item.id} is no longer active.`
          );
        }

        if (!variant.isActive) {
          throw new AppError(
            400,
            'VARIANT_UNAVAILABLE',
            `Variant ${variant.sku} is no longer active.`
          );
        }

        if (variant.stockQuantity < item.quantity) {
          throw new ConflictError(
            'INSUFFICIENT_STOCK',
            `Piece variant ${variant.sku} only has ${variant.stockQuantity} left in stock, but ${item.quantity} were requested.`,
            { variantId: variant.id, availableStock: variant.stockQuantity, requested: item.quantity }
          );
        }
      }

      // 2. Reserve Stock Atomically & Build Authoritative Line Items
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderItems: OrderItemEntity[] = [];
      let subtotalMinor = 0;

      for (const item of rawItems) {
        const variant = db.getVariantById(item.variantId)!;
        const product = db.getProductById(item.productId)!;

        // Decrement inventory in transactional state
        db.decrementVariantStock(variant.id, item.quantity);

        // Authoritative pricing calculation
        const unitPriceMinor = PricingService.getUnitPriceMinor(product, variant);
        const lineTotalMinor = PricingService.calculateLineTotalMinor(unitPriceMinor, item.quantity);
        subtotalMinor += lineTotalMinor;

        orderItems.push({
          id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          orderId,
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantSku: variant.sku,
          variantSize: variant.size,
          variantColor: variant.color,
          imageUrl: product.imageUrl || product.images[0],
          unitPriceMinor,
          quantity: item.quantity,
          lineTotalMinor,
        });
      }

      // 3. Authoritative Shipping & Tax Calculation
      // Standard: 500 KES (free over 30,000 KES); Express: 1,200 KES
      let shippingCostMinor = 0;
      if (input.shippingMethod === 'express') {
        shippingCostMinor = 120000; // 1,200.00 KES
      } else {
        shippingCostMinor = subtotalMinor >= 3000000 ? 0 : 50000; // 500.00 KES
      }

      const taxMinor = 0; // In Kenya, VAT is inclusive in luxury retail prices
      const totalMinor = subtotalMinor + shippingCostMinor + taxMinor;

      // 4. Generate Unique Order Number
      const orderNumber = `ATL-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderEntity: OrderEntity = {
        id: orderId,
        orderNumber,
        cartId,
        customer: {
          fullName: input.customer.fullName,
          email: input.customer.email,
          phone: input.customer.phone,
          addressLine1: input.customer.addressLine1,
          addressLine2: input.customer.addressLine2,
          city: input.customer.city,
          county: input.customer.county,
          postalCode: input.customer.postalCode,
          deliveryInstructions: input.customer.deliveryInstructions,
        },
        items: orderItems,
        subtotalMinor,
        shippingCostMinor,
        taxMinor,
        totalMinor,
        shippingMethod: input.shippingMethod,
        paymentMethod: input.paymentMethod,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = db.createOrder(orderEntity);

      const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
      for (const item of rawItems) {
        db.createStockReservation({
          id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          orderId,
          variantId: item.variantId,
          quantity: item.quantity,
          status: 'active',
          expiresAt: reservationExpiry,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 5. Clear the cart
      db.clearCartItems(cartId);

      return this.toDTO(created);
    });
  }

  /**
   * Releases unpaid reservations after their checkout window expires.
   * This is safe to call repeatedly and can also be run by a scheduled job.
   */
  public static expireReservations(now = new Date()): number {
    let expiredCount = 0;

    for (const reservation of db.getAllReservations()) {
      if (reservation.status !== 'active' || reservation.expiresAt > now) {
        continue;
      }

      db.incrementVariantStock(reservation.variantId, reservation.quantity);
      db.updateReservationStatus(reservation.id, 'expired');
      const order = db.getOrderById(reservation.orderId);
      if (order && order.paymentStatus === 'pending') {
        db.updateOrderStatus(order.id, 'cancelled');
        db.updateOrderPaymentStatus(order.id, 'failed');
      }
      expiredCount += 1;
    }

    return expiredCount;
  }

  /**
   * Retrieves an order by orderNumber.
   */
  public static getOrderByNumber(orderNumber: string): OrderDTO {
    const order = db.getOrderByNumber(orderNumber);
    if (!order) {
      throw new NotFoundError('Order', orderNumber);
    }
    return this.toDTO(order);
  }

  /**
   * Marks a delivered order as received by the customer.
   */
  public static receiveOrder(orderNumber: string): OrderDTO {
    return db.transaction(() => {
      const order = db.getOrderByNumber(orderNumber);
      if (!order) {
        throw new NotFoundError('Order', orderNumber);
      }

      if (order.status === 'received') {
        return this.toDTO(order);
      }

      if (order.status !== 'delivered') {
        throw new ConflictError(
          'ORDER_CANNOT_BE_RECEIVED',
          `Order ${orderNumber} must be delivered before it can be marked received.`
        );
      }

      const updated = db.updateOrderStatus(order.id, 'received');
      return this.toDTO(updated);
    });
  }

  /**
   * Cancels an order and restocks inventory within a transaction.
   */
  public static cancelOrder(orderNumber: string): OrderDTO {
    return db.transaction(() => {
      const order = db.getOrderByNumber(orderNumber);
      if (!order) {
        throw new NotFoundError('Order', orderNumber);
      }

      if (order.status === 'cancelled') {
        return this.toDTO(order);
      }

      if (order.status === 'shipped' || order.status === 'delivered') {
        throw new ConflictError(
          'ORDER_CANNOT_BE_CANCELLED',
          `Order ${orderNumber} has already been ${order.status} and cannot be automatically cancelled.`
        );
      }

      // Release each active reservation and return its inventory exactly once.
      for (const reservation of db.getReservationsByOrderId(order.id)) {
        if (reservation.status === 'active') {
          db.incrementVariantStock(reservation.variantId, reservation.quantity);
          db.updateReservationStatus(reservation.id, 'released');
        }
      }

      const updated = db.updateOrderStatus(order.id, 'cancelled');
      return this.toDTO(updated);
    });
  }

  public static toDTO(order: OrderEntity): OrderDTO {
    const items: OrderItemDTO[] = order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantSku: i.variantSku,
      variantSize: i.variantSize,
      variantColor: i.variantColor,
      imageUrl: i.imageUrl,
      unitPrice: PricingService.minorToMajor(i.unitPriceMinor),
      quantity: i.quantity,
      lineTotal: PricingService.minorToMajor(i.lineTotalMinor),
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      cartId: order.cartId,
      customer: { ...order.customer },
      items,
      subtotal: PricingService.minorToMajor(order.subtotalMinor),
      shippingCost: PricingService.minorToMajor(order.shippingCostMinor),
      tax: PricingService.minorToMajor(order.taxMinor),
      total: PricingService.minorToMajor(order.totalMinor),
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentIntentId: order.paymentIntentId,
      currency: 'KES',
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
