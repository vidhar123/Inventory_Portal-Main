export type ProductStatus = "active" | "draft" | "archived";

export interface Manufacturer {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  manufacturerId: string | null;
  manufacturerName: string | null;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  quantity: number;
  reorderLevel: number;
  status: ProductStatus;
  /** Signed image URLs generated from private object storage */
  images: string[];
  createdAt: string;
}

export type NewProduct = Omit<Product, "id" | "createdAt">;

export const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Home & Kitchen",
  "Beauty",
  "Sports",
  "Office",
  "Toys",
  "Other",
] as const;
