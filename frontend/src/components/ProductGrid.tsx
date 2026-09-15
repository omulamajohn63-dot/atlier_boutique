import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { EmptyState } from './ui/EmptyState';
import { PackageX } from 'lucide-react';

export interface ProductGridProps {
  products: Product[];
  onQuickView?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onQuickView,
  onProductClick,
}) => {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageX}
        title="No pieces found"
        description="We could not find any items matching your selected criteria. Try adjusting your filters or browsing all collections."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 sm:gap-y-12">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickView={onQuickView}
          onClick={onProductClick}
        />
      ))}
    </div>
  );
};
