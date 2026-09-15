import { ProductEntity, ProductVariantEntity } from '../db/types';

/**
 * Dedicated Pricing Service
 * All monetary amounts are handled strictly in integer minor units (cents)
 * to guarantee deterministic arithmetic free of IEEE-754 float drift.
 */
export class PricingService {
  /**
   * Resolves the authoritative unit price for a given variant and product.
   * Variant price overrides base product price if defined.
   */
  public static getUnitPriceMinor(
    product: ProductEntity,
    variant: ProductVariantEntity
  ): number {
    if (variant.priceMinor !== undefined && variant.priceMinor !== null) {
      return Math.round(variant.priceMinor);
    }
    return Math.round(product.priceMinor);
  }

  /**
   * Calculates the authoritative line total for a given quantity.
   */
  public static calculateLineTotalMinor(unitPriceMinor: number, quantity: number): number {
    if (quantity <= 0) {
      return 0;
    }
    return Math.round(unitPriceMinor * quantity);
  }

  /**
   * Calculates the authoritative subtotal for multiple line items.
   */
  public static calculateSubtotalMinor(
    items: Array<{ unitPriceMinor: number; quantity: number }>
  ): number {
    return items.reduce((acc, item) => {
      return acc + this.calculateLineTotalMinor(item.unitPriceMinor, item.quantity);
    }, 0);
  }

  /**
   * Formats minor units into display major units (e.g. 2450000 -> 24500.00)
   */
  public static minorToMajor(minorUnits: number): number {
    return minorUnits / 100;
  }

  /**
   * Converts major units to minor integer cents (e.g. 24500 -> 2450000)
   */
  public static majorToMinor(majorUnits: number): number {
    return Math.round(majorUnits * 100);
  }
}
