"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Manufacturer, Product } from "@/lib/types";

type ProductUpdate = Partial<
  Pick<
    Product,
    | "manufacturerId"
    | "name"
    | "sku"
    | "category"
    | "description"
    | "price"
    | "discountPercent"
    | "cost"
    | "quantity"
    | "reorderLevel"
    | "status"
  >
>;

interface InventoryContextValue {
  products: Product[];
  manufacturers: Manufacturer[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  refreshManufacturers: () => Promise<void>;
  addProduct: (data: FormData) => Promise<Product>;
  updateProduct: (id: string, data: ProductUpdate) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  addManufacturer: (name: string) => Promise<Manufacturer>;
  updateManufacturer: (id: string, name: string) => Promise<Manufacturer>;
  bulkUploadProducts: (
    manufacturerId: string,
    file: File
  ) => Promise<{ imported: number; skipped: number; errors: string[] }>;
  getProduct: (id: string) => Product | undefined;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload.error === "string" ? payload.error : "Request failed.";
    throw new Error(message);
  }
  return payload as T;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readJson<{ products: Product[] }>(
        await fetch("/api/products", { cache: "no-store" })
      );
      setProducts(data.products);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load products.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshManufacturers = useCallback(async () => {
    try {
      const data = await readJson<{ manufacturers: Manufacturer[] }>(
        await fetch("/api/manufacturers", { cache: "no-store" })
      );
      setManufacturers(data.manufacturers);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load manufacturers.";
      setError(message);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
    refreshManufacturers();
  }, [refreshProducts, refreshManufacturers]);

  const addProduct = useCallback(async (data: FormData) => {
    const result = await readJson<{ product: Product }>(
      await fetch("/api/products", {
        method: "POST",
        body: data,
      })
    );
    const product = result.product;
    setProducts((prev) => [product, ...prev.filter((p) => p.id !== product.id)]);
    return product;
  }, []);

  const updateProduct = useCallback(
    async (id: string, data: ProductUpdate) => {
      const result = await readJson<{ product: Product }>(
        await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? result.product : p))
      );
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    await readJson<{ ok: boolean }>(
      await fetch(`/api/products/${id}`, { method: "DELETE" })
    );
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addManufacturer = useCallback(async (name: string) => {
    const result = await readJson<{ manufacturer: Manufacturer }>(
      await fetch("/api/manufacturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    );
    setManufacturers((prev) =>
      [...prev, result.manufacturer].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    return result.manufacturer;
  }, []);

  const updateManufacturer = useCallback(async (id: string, name: string) => {
    const result = await readJson<{ manufacturer: Manufacturer }>(
      await fetch(`/api/manufacturers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    );
    setManufacturers((prev) =>
      prev
        .map((m) => (m.id === id ? result.manufacturer : m))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    await refreshProducts();
    return result.manufacturer;
  }, [refreshProducts]);

  const bulkUploadProducts = useCallback(
    async (manufacturerId: string, file: File) => {
      const formData = new FormData();
      formData.set("manufacturerId", manufacturerId);
      formData.set("file", file);
      const result = await readJson<{
        imported: number;
        skipped: number;
        errors: string[];
      }>(
        await fetch("/api/products/bulk", {
          method: "POST",
          body: formData,
        })
      );
      await refreshProducts();
      return result;
    },
    [refreshProducts]
  );

  const adjustStock = useCallback(
    async (id: string, delta: number) => {
      const current = products.find((p) => p.id === id);
      if (!current) return;
      await updateProduct(id, {
        quantity: Math.max(0, current.quantity + delta),
      });
    },
    [products, updateProduct]
  );

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      manufacturers,
      loading,
      error,
      refreshProducts,
      refreshManufacturers,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      addManufacturer,
      updateManufacturer,
      bulkUploadProducts,
      getProduct,
    }),
    [
      products,
      manufacturers,
      loading,
      error,
      refreshProducts,
      refreshManufacturers,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      addManufacturer,
      updateManufacturer,
      bulkUploadProducts,
      getProduct,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return ctx;
}
