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
import { NewProduct, Product } from "@/lib/types";

interface InventoryContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  addProduct: (data: FormData) => Promise<Product>;
  updateProduct: (
    id: string,
    data: Partial<Omit<NewProduct, "images">>
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
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

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

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
    async (id: string, data: Partial<Omit<NewProduct, "images">>) => {
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
      loading,
      error,
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      getProduct,
    }),
    [
      products,
      loading,
      error,
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
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
