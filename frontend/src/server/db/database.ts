import {
  CategoryEntity,
  ProductEntity,
  ProductVariantEntity,
  CartEntity,
  CartItemEntity,
  OrderEntity,
  PaymentIntentEntity,
  OrderStatus,
  PaymentStatus,
  StockReservationEntity,
  ReservationStatus,
} from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_VARIANTS } from './seed';

export interface DatabaseSnapshot {
  categories: CategoryEntity[];
  products: ProductEntity[];
  variants: ProductVariantEntity[];
  carts: CartEntity[];
  cartItems: CartItemEntity[];
  orders: OrderEntity[];
  paymentIntents: PaymentIntentEntity[];
  reservations: StockReservationEntity[];
}

export class RelationalDatabase {
  private categories = new Map<string, CategoryEntity>();
  private products = new Map<string, ProductEntity>();
  private variants = new Map<string, ProductVariantEntity>();
  private carts = new Map<string, CartEntity>();
  private cartItems = new Map<string, CartItemEntity>();
  private orders = new Map<string, OrderEntity>();
  private paymentIntents = new Map<string, PaymentIntentEntity>();
  private reservations = new Map<string, StockReservationEntity>();

  // Unique index lookups
  private categorySlugIndex = new Map<string, string>(); // slug -> id
  private productSlugIndex = new Map<string, string>();   // slug -> id
  private variantSkuIndex = new Map<string, string>();    // sku -> id
  private orderNumberIndex = new Map<string, string>();   // orderNumber -> id

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.categories.clear();
    this.products.clear();
    this.variants.clear();
    this.carts.clear();
    this.cartItems.clear();
    this.orders.clear();
    this.paymentIntents.clear();
    this.reservations.clear();
    this.categorySlugIndex.clear();
    this.productSlugIndex.clear();
    this.variantSkuIndex.clear();
    this.orderNumberIndex.clear();

    for (const cat of INITIAL_CATEGORIES) {
      this.insertCategory(cat);
    }
    for (const prod of INITIAL_PRODUCTS) {
      this.insertProduct(prod);
    }
    for (const v of INITIAL_VARIANTS) {
      this.insertVariant(v);
    }
  }

  // --- Snapshot & Transaction Support ---
  public snapshot(): DatabaseSnapshot {
    return {
      categories: Array.from(this.categories.values()).map((c) => ({ ...c })),
      products: Array.from(this.products.values()).map((p) => ({ ...p, images: [...p.images], details: p.details ? [...p.details] : undefined })),
      variants: Array.from(this.variants.values()).map((v) => ({ ...v })),
      carts: Array.from(this.carts.values()).map((c) => ({ ...c })),
      cartItems: Array.from(this.cartItems.values()).map((ci) => ({ ...ci })),
      orders: Array.from(this.orders.values()).map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })), customer: { ...o.customer } })),
      paymentIntents: Array.from(this.paymentIntents.values()).map((p) => ({ ...p })),
      reservations: Array.from(this.reservations.values()).map((r) => ({ ...r })),
    };
  }

  public restoreSnapshot(snap: DatabaseSnapshot): void {
    this.categories.clear();
    this.categorySlugIndex.clear();
    for (const c of snap.categories) this.insertCategory(c);

    this.products.clear();
    this.productSlugIndex.clear();
    for (const p of snap.products) this.insertProduct(p);

    this.variants.clear();
    this.variantSkuIndex.clear();
    for (const v of snap.variants) this.insertVariant(v);

    this.carts.clear();
    for (const c of snap.carts) this.carts.set(c.id, { ...c });

    this.cartItems.clear();
    for (const ci of snap.cartItems) this.cartItems.set(ci.id, { ...ci });

    this.orders.clear();
    this.orderNumberIndex.clear();
    for (const o of snap.orders) {
      this.orders.set(o.id, { ...o });
      this.orderNumberIndex.set(o.orderNumber, o.id);
    }

    this.paymentIntents.clear();
    for (const pi of snap.paymentIntents) {
      this.paymentIntents.set(pi.id, { ...pi });
    }

    this.reservations.clear();
    for (const r of snap.reservations) {
      this.reservations.set(r.id, { ...r });
    }
  }

  public transaction<T>(work: () => T): T {
    const snap = this.snapshot();
    try {
      return work();
    } catch (err) {
      this.restoreSnapshot(snap);
      throw err;
    }
  }

  // --- Category Methods & Constraints ---
  public insertCategory(cat: CategoryEntity): CategoryEntity {
    if (this.categories.has(cat.id)) {
      throw new Error(`Integrity error: Category ID ${cat.id} already exists`);
    }
    if (this.categorySlugIndex.has(cat.slug)) {
      throw new Error(`Integrity error: Category slug '${cat.slug}' already exists`);
    }
    this.categories.set(cat.id, { ...cat });
    this.categorySlugIndex.set(cat.slug, cat.id);
    return this.categories.get(cat.id)!;
  }

  public getCategoryById(id: string): CategoryEntity | undefined {
    const cat = this.categories.get(id);
    return cat ? { ...cat } : undefined;
  }

  public getCategoryBySlug(slug: string): CategoryEntity | undefined {
    const id = this.categorySlugIndex.get(slug);
    if (!id) return undefined;
    return this.getCategoryById(id);
  }

  public getAllCategories(): CategoryEntity[] {
    return Array.from(this.categories.values()).map((c) => ({ ...c }));
  }

  // --- Product Methods & Constraints ---
  public insertProduct(prod: ProductEntity): ProductEntity {
    if (this.products.has(prod.id)) {
      throw new Error(`Integrity error: Product ID ${prod.id} already exists`);
    }
    if (this.productSlugIndex.has(prod.slug)) {
      throw new Error(`Integrity error: Product slug '${prod.slug}' already exists`);
    }
    if (!this.categories.has(prod.categoryId)) {
      throw new Error(`Foreign key constraint failed: Category ${prod.categoryId} does not exist`);
    }
    if (prod.priceMinor < 0) {
      throw new Error('Constraint violation: Product price must be greater than or equal to zero');
    }
    if (prod.compareAtPriceMinor !== undefined && prod.compareAtPriceMinor <= prod.priceMinor) {
      throw new Error('Constraint violation: compareAtPrice must be greater than the price');
    }

    this.products.set(prod.id, { ...prod });
    this.productSlugIndex.set(prod.slug, prod.id);
    return this.products.get(prod.id)!;
  }

  public updateProduct(id: string, updates: Partial<ProductEntity>): ProductEntity {
    const current = this.products.get(id);
    if (!current) {
      throw new Error(`Product ${id} not found`);
    }

    if (updates.slug && updates.slug !== current.slug) {
      if (this.productSlugIndex.has(updates.slug)) {
        throw new Error(`Integrity error: Product slug '${updates.slug}' already exists`);
      }
      this.productSlugIndex.delete(current.slug);
      this.productSlugIndex.set(updates.slug, id);
    }

    if (updates.categoryId && !this.categories.has(updates.categoryId)) {
      throw new Error(`Foreign key constraint failed: Category ${updates.categoryId} does not exist`);
    }

    const updatedPrice = updates.priceMinor !== undefined ? updates.priceMinor : current.priceMinor;
    if (updatedPrice < 0) {
      throw new Error('Constraint violation: Product price must be greater than or equal to zero');
    }

    const updatedCompareAt = updates.compareAtPriceMinor !== undefined ? updates.compareAtPriceMinor : current.compareAtPriceMinor;
    if (updatedCompareAt !== undefined && updatedCompareAt <= updatedPrice) {
      throw new Error('Constraint violation: compareAtPrice must be greater than the price');
    }

    const merged: ProductEntity = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    this.products.set(id, merged);
    return { ...merged };
  }

  public getProductById(id: string): ProductEntity | undefined {
    const prod = this.products.get(id);
    return prod ? { ...prod } : undefined;
  }

  public getProductBySlug(slug: string): ProductEntity | undefined {
    const id = this.productSlugIndex.get(slug);
    if (!id) return undefined;
    return this.getProductById(id);
  }

  public getAllProducts(): ProductEntity[] {
    return Array.from(this.products.values()).map((p) => ({ ...p }));
  }

  // --- Variant Methods & Constraints ---
  public insertVariant(variant: ProductVariantEntity): ProductVariantEntity {
    if (this.variants.has(variant.id)) {
      throw new Error(`Integrity error: Variant ID ${variant.id} already exists`);
    }
    if (this.variantSkuIndex.has(variant.sku)) {
      throw new Error(`Integrity error: SKU '${variant.sku}' already exists`);
    }
    if (!this.products.has(variant.productId)) {
      throw new Error(`Foreign key constraint failed: Product ${variant.productId} does not exist`);
    }
    if (variant.stockQuantity < 0) {
      throw new Error('Constraint violation: Variant stockQuantity must be greater than or equal to 0');
    }
    if (variant.priceMinor !== undefined && variant.priceMinor < 0) {
      throw new Error('Constraint violation: Variant price must be greater than or equal to 0');
    }

    this.variants.set(variant.id, { ...variant });
    this.variantSkuIndex.set(variant.sku, variant.id);
    return this.variants.get(variant.id)!;
  }

  public getVariantById(id: string): ProductVariantEntity | undefined {
    const v = this.variants.get(id);
    return v ? { ...v } : undefined;
  }

  public getVariantsByProductId(productId: string): ProductVariantEntity[] {
    const result: ProductVariantEntity[] = [];
    for (const v of this.variants.values()) {
      if (v.productId === productId) {
        result.push({ ...v });
      }
    }
    return result;
  }

  public updateVariantStock(id: string, newStock: number): ProductVariantEntity {
    if (newStock < 0) {
      throw new Error('Constraint violation: stockQuantity cannot be negative');
    }
    const current = this.variants.get(id);
    if (!current) {
      throw new Error(`Variant ${id} not found`);
    }
    const updated: ProductVariantEntity = {
      ...current,
      stockQuantity: newStock,
      updatedAt: new Date(),
    };
    this.variants.set(id, updated);
    return { ...updated };
  }

  // --- Cart & Cart Item Methods ---
  public createCart(cartId?: string, userId?: string): CartEntity {
    const id = cartId || `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCart: CartEntity = {
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.carts.set(id, newCart);
    return { ...newCart };
  }

  public getCartById(id: string): CartEntity | undefined {
    const cart = this.carts.get(id);
    return cart ? { ...cart } : undefined;
  }

  public getCartItems(cartId: string): CartItemEntity[] {
    const items: CartItemEntity[] = [];
    for (const item of this.cartItems.values()) {
      if (item.cartId === cartId) {
        items.push({ ...item });
      }
    }
    return items;
  }

  public getCartItemById(itemId: string): CartItemEntity | undefined {
    const item = this.cartItems.get(itemId);
    return item ? { ...item } : undefined;
  }

  public findCartItemByVariant(cartId: string, variantId: string): CartItemEntity | undefined {
    for (const item of this.cartItems.values()) {
      if (item.cartId === cartId && item.variantId === variantId) {
        return { ...item };
      }
    }
    return undefined;
  }

  public insertCartItem(item: CartItemEntity): CartItemEntity {
    if (item.quantity <= 0) {
      throw new Error('Constraint violation: Cart item quantity must be greater than 0');
    }
    if (!this.carts.has(item.cartId)) {
      throw new Error(`Foreign key constraint failed: Cart ${item.cartId} does not exist`);
    }
    if (!this.variants.has(item.variantId)) {
      throw new Error(`Foreign key constraint failed: Variant ${item.variantId} does not exist`);
    }
    if (!this.products.has(item.productId)) {
      throw new Error(`Foreign key constraint failed: Product ${item.productId} does not exist`);
    }

    this.cartItems.set(item.id, { ...item });

    // Touch cart updated timestamp
    const cart = this.carts.get(item.cartId);
    if (cart) {
      cart.updatedAt = new Date();
    }

    return { ...item };
  }

  public updateCartItemQuantity(itemId: string, quantity: number): CartItemEntity {
    const item = this.cartItems.get(itemId);
    if (!item) {
      throw new Error(`CartItem ${itemId} not found`);
    }
    if (quantity <= 0) {
      throw new Error('Constraint violation: Cart item quantity must be greater than 0');
    }

    item.quantity = quantity;
    item.updatedAt = new Date();

    const cart = this.carts.get(item.cartId);
    if (cart) {
      cart.updatedAt = new Date();
    }

    return { ...item };
  }

  public deleteCartItem(itemId: string): boolean {
    const item = this.cartItems.get(itemId);
    if (!item) return false;

    const cartId = item.cartId;
    this.cartItems.delete(itemId);

    const cart = this.carts.get(cartId);
    if (cart) {
      cart.updatedAt = new Date();
    }
    return true;
  }

  public clearCartItems(cartId: string): void {
    for (const [id, item] of this.cartItems.entries()) {
      if (item.cartId === cartId) {
        this.cartItems.delete(id);
      }
    }
    const cart = this.carts.get(cartId);
    if (cart) {
      cart.updatedAt = new Date();
    }
  }

  // --- Inventory Concurrency & Stock Adjustments ---
  public decrementVariantStock(variantId: string, quantity: number): ProductVariantEntity {
    const variant = this.variants.get(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }
    if (variant.stockQuantity < quantity) {
      throw new Error(
        `Insufficient stock for variant ${variant.sku}: requested ${quantity}, available ${variant.stockQuantity}`
      );
    }

    variant.stockQuantity -= quantity;
    variant.updatedAt = new Date();
    return { ...variant };
  }

  public incrementVariantStock(variantId: string, quantity: number): ProductVariantEntity {
    const variant = this.variants.get(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }
    variant.stockQuantity += quantity;
    variant.updatedAt = new Date();
    return { ...variant };
  }

  // --- Order Methods & Constraints ---
  public createOrder(order: OrderEntity): OrderEntity {
    if (this.orders.has(order.id)) {
      throw new Error(`Integrity error: Order ID ${order.id} already exists`);
    }
    if (this.orderNumberIndex.has(order.orderNumber)) {
      throw new Error(`Integrity error: Order number ${order.orderNumber} already exists`);
    }

    this.orders.set(order.id, {
      ...order,
      items: order.items.map((i) => ({ ...i })),
      customer: { ...order.customer },
    });
    this.orderNumberIndex.set(order.orderNumber, order.id);

    return this.getOrderById(order.id)!;
  }

  public getOrderById(id: string): OrderEntity | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    return {
      ...order,
      items: order.items.map((i) => ({ ...i })),
      customer: { ...order.customer },
    };
  }

  public getOrderByNumber(orderNumber: string): OrderEntity | undefined {
    const id = this.orderNumberIndex.get(orderNumber.trim().toUpperCase());
    if (!id) return undefined;
    return this.getOrderById(id);
  }

  public updateOrderStatus(id: string, status: OrderStatus): OrderEntity {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error(`Order ${id} not found`);
    }
    order.status = status;
    order.updatedAt = new Date();
    return this.getOrderById(id)!;
  }

  public updateOrderPaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentIntentId?: string
  ): OrderEntity {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error(`Order ${id} not found`);
    }
    order.paymentStatus = paymentStatus;
    if (paymentIntentId) {
      order.paymentIntentId = paymentIntentId;
    }
    if (paymentStatus === 'paid' && order.status === 'pending') {
      order.status = 'confirmed';
    }
    order.updatedAt = new Date();
    return this.getOrderById(id)!;
  }

  public getAllOrders(): OrderEntity[] {
    return Array.from(this.orders.values()).map((o) => ({
      ...o,
      items: o.items.map((i) => ({ ...i })),
      customer: { ...o.customer },
    }));
  }

  // --- Stock Reservation Methods ---
  public createStockReservation(reservation: StockReservationEntity): StockReservationEntity {
    if (this.reservations.has(reservation.id)) {
      throw new Error(`Integrity error: Reservation ID ${reservation.id} already exists`);
    }
    if (!this.orders.has(reservation.orderId)) {
      throw new Error(`Foreign key constraint failed: Order ${reservation.orderId} does not exist`);
    }
    if (!this.variants.has(reservation.variantId)) {
      throw new Error(`Foreign key constraint failed: Variant ${reservation.variantId} does not exist`);
    }
    if (!Number.isInteger(reservation.quantity) || reservation.quantity <= 0) {
      throw new Error('Constraint violation: reservation quantity must be a positive integer');
    }

    this.reservations.set(reservation.id, { ...reservation });
    return { ...reservation };
  }

  public getReservationsByOrderId(orderId: string): StockReservationEntity[] {
    return Array.from(this.reservations.values())
      .filter((reservation) => reservation.orderId === orderId)
      .map((reservation) => ({ ...reservation }));
  }

  public getAllReservations(): StockReservationEntity[] {
    return Array.from(this.reservations.values()).map((reservation) => ({ ...reservation }));
  }

  public updateReservationStatus(id: string, status: ReservationStatus): StockReservationEntity {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error(`Reservation ${id} not found`);
    }
    reservation.status = status;
    reservation.updatedAt = new Date();
    return { ...reservation };
  }

  // --- Payment Intent Methods ---
  public createPaymentIntent(intent: PaymentIntentEntity): PaymentIntentEntity {
    this.paymentIntents.set(intent.id, { ...intent });
    return { ...intent };
  }

  public getPaymentIntentById(id: string): PaymentIntentEntity | undefined {
    const pi = this.paymentIntents.get(id);
    return pi ? { ...pi } : undefined;
  }

  public getPaymentIntentByClientSecret(clientSecret: string): PaymentIntentEntity | undefined {
    for (const intent of this.paymentIntents.values()) {
      if (intent.clientSecret === clientSecret) {
        return { ...intent };
      }
    }
    return undefined;
  }

  public updatePaymentIntentStatus(
    id: string,
    status: 'pending' | 'succeeded' | 'failed',
    gatewayReference?: string
  ): PaymentIntentEntity {
    const pi = this.paymentIntents.get(id);
    if (!pi) {
      throw new Error(`PaymentIntent ${id} not found`);
    }
    pi.status = status;
    if (gatewayReference) {
      pi.gatewayReference = gatewayReference;
    }
    pi.updatedAt = new Date();
    return { ...pi };
  }
}

// Export singleton database instance
export const db = new RelationalDatabase();
