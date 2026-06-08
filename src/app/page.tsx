"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useInventory } from "@/context/InventoryContext";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { ProductThumb } from "@/components/ProductThumb";
import { BoxIcon, DollarIcon, AlertIcon, LayersIcon } from "@/components/icons";
import { formatCurrency, formatNumber, stockLevel } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export default function DashboardPage() {
  const { products, loading, error, refreshProducts } = useInventory();

  const stats = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
    const inventoryValue = products.reduce((s, p) => s + p.quantity * p.cost, 0);
    const retailValue = products.reduce((s, p) => s + p.quantity * p.price, 0);
    const lowStock = products.filter((p) => stockLevel(p) === "low").length;
    const outOfStock = products.filter((p) => stockLevel(p) === "out").length;
    return {
      skuCount: products.length,
      totalUnits,
      inventoryValue,
      retailValue,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of CATEGORIES) map.set(c, 0);
    for (const p of products) {
      map.set(p.category, (map.get(p.category) ?? 0) + p.quantity);
    }
    const entries = [...map.entries()].filter(([, v]) => v > 0);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: Math.round((value / max) * 100) }));
  }, [products]);

  const attention = useMemo(
    () =>
      products
        .filter((p) => stockLevel(p) !== "ok")
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5),
    [products]
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your inventory health and value."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load inventory data.</p>
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
          Loading inventory data...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Products"
          value={formatNumber(stats.skuCount)}
          hint={`${formatNumber(stats.totalUnits)} units in stock`}
          accent="blue"
          icon={BoxIcon}
        />
        <StatCard
          label="Inventory Value"
          value={formatCurrency(stats.inventoryValue)}
          hint={`${formatCurrency(stats.retailValue)} at retail`}
          accent="green"
          icon={DollarIcon}
        />
        <StatCard
          label="Low Stock"
          value={formatNumber(stats.lowStock)}
          hint="At or below reorder level"
          accent="amber"
          icon={AlertIcon}
        />
        <StatCard
          label="Out of Stock"
          value={formatNumber(stats.outOfStock)}
          hint="Needs restocking now"
          accent="rose"
          icon={LayersIcon}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Stock by category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Stock by category
            </h2>
            <span className="text-xs text-slate-400">Units</span>
          </div>
          <div className="space-y-4">
            {byCategory.length === 0 && (
              <p className="text-sm text-slate-400">No stock to display.</p>
            )}
            {byCategory.map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {formatNumber(row.value)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs attention */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Needs attention
            </h2>
            <Link
              href="/inventory"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {attention.length === 0 && (
              <p className="text-sm text-slate-400">
                Everything is well stocked. 🎉
              </p>
            )}
            {attention.map((p) => {
              const level = stockLevel(p);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <ProductThumb product={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <Badge tone={level === "out" ? "red" : "amber"}>
                    {p.quantity} left
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
