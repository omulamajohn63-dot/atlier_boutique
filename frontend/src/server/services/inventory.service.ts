import { ProductVariantEntity } from '../db/types';

export interface InventoryValidationResult {
  valid: boolean;
  code?: 'INSUFFICIENT_STOCK' | 'INVALID_QUANTITY' | 'VARIANT_UNAVAILABLE';
  message?: string;
  availableStock: number;
}

/**
 * Dedicated Inventory Service
 * Enforces stock constraints, non-negative quantities, and availability verification.
 */
export class InventoryService {
  /**
   * Checks whether a variant is active and has available stock.
   */
  public static isVariantAvailable(variant: ProductVariantEntity): boolean {
    return variant.isActive && variant.stockQuantity > 0;
  }

  /**
   * Returns current stock quantity.
   */
  public static getStock(variant: ProductVariantEntity): number {
    return Math.max(0, variant.stockQuantity);
  }

  /**
   * Validates if a requested quantity is permissible against current stock.
   */
  public static validateQuantity(
    variant: ProductVariantEntity,
    requestedQuantity: number
  ): InventoryValidationResult {
    if (!variant.isActive) {
      return {
        valid: false,
        code: 'VARIANT_UNAVAILABLE',
        message: `Variant '${variant.sku}' is currently deactivated and cannot be purchased.`,
        availableStock: 0,
      };
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      return {
        valid: false,
        code: 'INVALID_QUANTITY',
        message: 'Quantity must be a positive integer greater than zero.',
        availableStock: variant.stockQuantity,
      };
    }

    if (variant.stockQuantity < 0) {
      return {
        valid: false,
        code: 'INSUFFICIENT_STOCK',
        message: 'Inventory state is invalid or depleted.',
        availableStock: 0,
      };
    }

    if (requestedQuantity > variant.stockQuantity) {
      return {
        valid: false,
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${variant.stockQuantity} piece(s) available in stock for '${variant.sku}'.`,
        availableStock: variant.stockQuantity,
      };
    }

    return {
      valid: true,
      availableStock: variant.stockQuantity,
    };
  }
}
