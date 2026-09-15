import { db } from '../db/database';
import { CartDTO, CartItemDTO } from '../types/api';
import { NotFoundError, AppError, ConflictError } from '../errors/app-error';
import { PricingService } from './pricing.service';
import { InventoryService } from './inventory.service';

export class CartService {
  /**
   * Retrieves or initializes a cart, computing authoritative server-side totals.
   */
  public static getCart(cartId: string): CartDTO {
    let cart = db.getCartById(cartId);
    if (!cart) {
      cart = db.createCart(cartId);
    }

    const rawItems = db.getCartItems(cartId);
    const itemDTOs: CartItemDTO[] = [];
    let subtotalMinor = 0;
    let totalItems = 0;

    for (const item of rawItems) {
      const product = db.getProductById(item.productId);
      const variant = db.getVariantById(item.variantId);

      if (!product || !variant) {
        // Stale item reference; cleanup
        db.deleteCartItem(item.id);
        continue;
      }

      // Authoritative unit price derived strictly from DB
      const unitPriceMinor = PricingService.getUnitPriceMinor(product, variant);
      const lineTotalMinor = PricingService.calculateLineTotalMinor(unitPriceMinor, item.quantity);

      subtotalMinor += lineTotalMinor;
      totalItems += item.quantity;

      itemDTOs.push({
        id: item.id,
        productId: product.id,
        variantId: variant.id,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.imageUrl || product.images[0],
        },
        variant: {
          id: variant.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stockQuantity: variant.stockQuantity,
        },
        quantity: item.quantity,
        unitPrice: PricingService.minorToMajor(unitPriceMinor),
        lineTotal: PricingService.minorToMajor(lineTotalMinor),
      });
    }

    return {
      id: cart.id,
      items: itemDTOs,
      subtotal: PricingService.minorToMajor(subtotalMinor),
      itemCount: totalItems,
      currency: 'KES',
    };
  }

  /**
   * Adds an item to the cart after verifying product status, variant status,
   * and current inventory limits. Never trusts client-supplied pricing or inventory.
   */
  public static addItem(cartId: string, variantId: string, quantity: number): CartDTO {
    // 1. Transactional isolation
    return db.transaction(() => {
      // 2. Fetch Variant
      const variant = db.getVariantById(variantId);
      if (!variant) {
        throw new NotFoundError('Variant', variantId);
      }

      // 3. Fetch Product
      const product = db.getProductById(variant.productId);
      if (!product) {
        throw new NotFoundError('Product', variant.productId);
      }

      // 4. Verify Product availability
      if (product.status !== 'ACTIVE') {
        throw new AppError(
          400,
          'PRODUCT_UNAVAILABLE',
          `Product '${product.name}' is currently unavailable for purchase (${product.status}).`
        );
      }

      // 5. Verify Variant availability
      if (!variant.isActive) {
        throw new AppError(
          400,
          'VARIANT_UNAVAILABLE',
          `Selected piece variant (${variant.sku}) is currently deactivated.`
        );
      }

      // 6. Find existing cart item to check cumulative quantity
      const existingItem = db.findCartItemByVariant(cartId, variantId);
      const prospectiveQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

      // 7. Validate inventory
      const stockCheck = InventoryService.validateQuantity(variant, prospectiveQuantity);
      if (!stockCheck.valid) {
        throw new ConflictError(
          stockCheck.code || 'INSUFFICIENT_STOCK',
          stockCheck.message || 'Requested quantity exceeds available stock.',
          { availableStock: stockCheck.availableStock, requested: prospectiveQuantity }
        );
      }

      // 8. Update existing or insert new cart item
      if (existingItem) {
        db.updateCartItemQuantity(existingItem.id, prospectiveQuantity);
      } else {
        const newItemId = `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.insertCartItem({
          id: newItemId,
          cartId,
          productId: product.id,
          variantId: variant.id,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 9. Recalculate and return authoritative cart
      return this.getCart(cartId);
    });
  }

  /**
   * Updates the quantity of an item in the cart.
   * Enforces cart ownership and checks inventory limits.
   */
  public static updateItem(cartId: string, itemId: string, quantity: number): CartDTO {
    return db.transaction(() => {
      const item = db.getCartItemById(itemId);

      // Ownership and existence verification
      if (!item || item.cartId !== cartId) {
        throw new NotFoundError('Cart_Item', itemId);
      }

      const variant = db.getVariantById(item.variantId);
      if (!variant) {
        throw new NotFoundError('Variant', item.variantId);
      }

      // Check stock
      const stockCheck = InventoryService.validateQuantity(variant, quantity);
      if (!stockCheck.valid) {
        throw new ConflictError(
          stockCheck.code || 'INSUFFICIENT_STOCK',
          stockCheck.message || 'Requested quantity exceeds available stock.',
          { availableStock: stockCheck.availableStock, requested: quantity }
        );
      }

      // Update quantity
      db.updateCartItemQuantity(itemId, quantity);

      // Recalculate
      return this.getCart(cartId);
    });
  }

  /**
   * Removes an item from the cart.
   * Enforces cart ownership.
   */
  public static removeItem(cartId: string, itemId: string): CartDTO {
    const item = db.getCartItemById(itemId);

    if (!item || item.cartId !== cartId) {
      throw new NotFoundError('Cart_Item', itemId);
    }

    db.deleteCartItem(itemId);
    return this.getCart(cartId);
  }

  /**
   * Clears all items from the cart.
   */
  public static clearCart(cartId: string): CartDTO {
    db.clearCartItems(cartId);
    return this.getCart(cartId);
  }
}
