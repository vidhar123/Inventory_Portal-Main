"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { ProductThumb } from "@/components/ProductThumb";
import { PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { formatCurrency, formatNumber, stockLevel } from "@/lib/utils";
import { CATEGORIES, ProductStatus } from "@/lib/types";

const statusTone: Record<ProductStatus, "green" | "slate" | "amber"> = {
  active: "green",
  draft: "amber",
  archived: "slate",
};

export default function ProductsPage() {
  const { products, deleteProduct, loading, error, refreshProducts } =
    useInventory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<"All" | ProductStatus>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory = category === "All" || p.category === category;
      const matchesStatus = status === "All" || p.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, category, status]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${formatNumber(products.length)} products in your catalog`}
      >
        <Link
          href="/products/add"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" /> Add Product
        </Link>
      </PageHeader>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load products.</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={refreshProducts}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading products...
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU or category…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "All" | ProductStatus)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="text-sm font-medium text-slate-600">No products found</p>
          <p className="mt-1 text-sm text-slate-400">
            Try adjusting your filters or add a new product.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const level = stockLevel(p);
            return (
              <div
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductThumb
                      product={p}
                      size="lg"
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !rounded-2xl"
                    />
                  )}
                  <div className="absolute left-3 top-3">
                    <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                  </div>
                  {p.images.length > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">
                      +{p.images.length - 1}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                    {p.category}
                  </p>
                  <h3 className="mt-1 line-clamp-1 font-semibold text-slate-900">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">{p.sku}</p>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(p.price)}
                    </span>
                    <Badge
                      tone={level === "out" ? "red" : level === "low" ? "amber" : "green"}
                    >
                      {level === "out"
                        ? "Out of stock"
                        : `${formatNumber(p.quantity)} in stock`}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={async () => {
                        if (
                          confirm(`Delete "${p.name}"? This cannot be undone.`)
                        ) {
                          try {
                            await deleteProduct(p.id);
                          } catch (error) {
                            alert(
                              error instanceof Error
                                ? error.message
                                : "Failed to delete product."
                            );
                          }
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <TrashIcon className="h-4 w-4" /> Delete
                    </button>
                    <span className="ml-auto text-xs text-slate-400">
                      Margin{" "}
                      {p.price > 0
                        ? `${Math.round(((p.price - p.cost) / p.price) * 100)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
