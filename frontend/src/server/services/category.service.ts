import { db } from '../db/database';
import { CategoryDTO, ProductDTO } from '../types/api';
import { NotFoundError } from '../errors/app-error';
import { CategoryCreateInput } from '../schemas/category.schema';
import { ProductService } from './product.service';

export class CategoryService {
  /**
   * Retrieves categories. Public users only see active categories.
   */
  public static getCategories(includeInactive = false): CategoryDTO[] {
    const all = db.getAllCategories();
    return all
      .filter((c) => includeInactive || c.isActive)
      .map((c) => this.toDTO(c));
  }

  /**
   * Retrieves category by slug, along with its publicly active products.
   */
  public static getCategoryWithProducts(slug: string): {
    category: CategoryDTO;
    products: ProductDTO[];
  } {
    const category = db.getCategoryBySlug(slug);
    if (!category || !category.isActive) {
      throw new NotFoundError('Category', slug);
    }

    const productsResponse = ProductService.getProducts({
      page: 1,
      limit: 100,
      category: category.slug,
      sort: 'newest',
    });

    return {
      category: this.toDTO(category),
      products: productsResponse.data,
    };
  }

  /**
   * Admin: Creates a new category.
   */
  public static createCategory(input: CategoryCreateInput): CategoryDTO {
    const id = `cat-${Date.now()}`;
    const entity = db.insertCategory({
      id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      imageUrl: input.imageUrl,
      isActive: input.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.toDTO(entity);
  }

  public static toDTO(entity: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    isActive: boolean;
  }): CategoryDTO {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      imageUrl: entity.imageUrl,
      isActive: entity.isActive,
    };
  }
}
