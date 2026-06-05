"use client";

import { useMemo, useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { ProductThumb } from "@/components/ProductThumb";
import { formatCurrency, formatNumber, stockLevel } from "@/lib/utils";
import { Product, ProductStatus } from "@/lib/types";

type Filter = "all" | "low" | "out";
type EditForm = {
  price: string;
  cost: string;
  quantity: string;
  reorderLevel: string;
  status: ProductStatus;
};

function makeEditForm(product: Product): EditForm {
  return {
    price: String(product.price),
    cost: String(product.cost),
    quantity: String(product.quantity),
    reorderLevel: String(product.reorderLevel),
    status: product.status,
  };
}

export default function InventoryPage() {
  const {
    products,
    adjustStock,
    updateProduct,
    loading,
    error,
    refreshProducts,
  } = useInventory();
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const counts = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const p of products) {
      const lvl = stockLevel(p);
      if (lvl === "low") low++;
      if (lvl === "out") out++;
    }
    return { all: products.length, low, out };
  }, [products]);

  const rows = useMemo(() => {
    const list =
      filter === "all"
        ? products
        : products.filter((p) => stockLevel(p) === filter);
    return [...list].sort((a, b) => a.quantity - b.quantity);
  }, [products, filter]);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "low", label: "Low stock", count: counts.low },
    { key: "out", label: "Out of stock", count: counts.out },
  ];

  const editingProduct = editingId
    ? products.find((product) => product.id === editingId)
    : null;

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditForm(makeEditForm(product));
    setEditError(null);
  }

  function closeEdit() {
    setEditingId(null);
    setEditForm(null);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;

    const price = Number(editForm.price);
    const cost = Number(editForm.cost);
    const quantity = Number(editForm.quantity);
    const reorderLevel = Number(editForm.reorderLevel);

    if ([price, cost, quantity, reorderLevel].some((value) => Number.isNaN(value) || value < 0)) {
      setEditError("Please enter valid non-negative values.");
      return;
    }

    try {
      await updateProduct(editingId, {
        price,
        cost,
        quantity,
        reorderLevel,
        status: editForm.status,
      });
      closeEdit();
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Failed to save changes."
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Track and adjust stock levels across your catalog."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load inventory.</p>
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
          Loading inventory...
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition " +
              (filter === t.key
                ? "bg-brand-500 text-white"
                : "text-slate-600 hover:bg-slate-100")
            }
          >
            {t.label}
            <span
              className={
                "rounded-full px-1.5 text-xs " +
                (filter === t.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500")
              }
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 text-right font-semibold">Selling price</th>
                <th className="px-5 py-3 text-right font-semibold">Unit cost</th>
                <th className="px-5 py-3 text-right font-semibold">Reorder at</th>
                <th className="px-5 py-3 text-center font-semibold">Quantity</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Stock value</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    No products in this view.
                  </td>
                </tr>
              )}
              {rows.map((p) => {
                const level = stockLevel(p);
                return (
                  <tr key={p.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={p} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.category}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-800">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                      {formatCurrency(p.cost)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                      {formatNumber(p.reorderLevel)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            adjustStock(p.id, -1).catch((error) =>
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update stock."
                              )
                            );
                          }}
                          disabled={p.quantity <= 0}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-semibold tabular-nums text-slate-900">
                          {formatNumber(p.quantity)}
                        </span>
                        <button
                          onClick={() => {
                            adjustStock(p.id, 1).catch((error) =>
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update stock."
                              )
                            );
                          }}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={level === "out" ? "red" : level === "low" ? "amber" : "green"}
                      >
                        {level === "out"
                          ? "Out of stock"
                          : level === "low"
                          ? "Low stock"
                          : "In stock"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-800">
                      {formatCurrency(p.quantity * p.cost)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 transition hover:border-brand-200 hover:bg-brand-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && editForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ProductThumb product={editingProduct} size="sm" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Edit inventory
                  </h2>
                  <p className="text-sm text-slate-500">
                    {editingProduct.name} · {editingProduct.sku}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Selling price (INR)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(event) =>
                    setEditForm({ ...editForm, price: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Unit cost (INR)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.cost}
                  onChange={(event) =>
                    setEditForm({ ...editForm, cost: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Quantity
                </span>
                <input
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(event) =>
                    setEditForm({ ...editForm, quantity: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reorder level
                </span>
                <input
                  type="number"
                  min="0"
                  value={editForm.reorderLevel}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      reorderLevel: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product status
                </span>
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      status: event.target.value as ProductStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>

            {editError && (
              <p className="mt-3 text-sm font-medium text-rose-600">
                {editError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
