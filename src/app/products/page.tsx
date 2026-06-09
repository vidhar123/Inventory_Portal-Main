"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { ProductThumb } from "@/components/ProductThumb";
import {
  CloseIcon,
  ImageIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/icons";
import { formatCurrency, formatNumber, stockLevel } from "@/lib/utils";
import { CATEGORIES, Product, ProductStatus } from "@/lib/types";

const statusTone: Record<ProductStatus, "green" | "slate" | "amber"> = {
  active: "green",
  draft: "amber",
  archived: "slate",
};

function ProductGallery({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = product.images[activeIndex];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-2 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-1rem)] w-full max-w-[min(920px,calc(100vw-1rem))] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {product.name}
            </h2>
            <p className="text-sm text-slate-500">
              {product.manufacturerName ?? "No manufacturer"} · {product.sku}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close gallery"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_128px]">
          <div className="grid h-[min(62vh,520px)] place-items-center overflow-hidden rounded-2xl bg-slate-100">
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${product.name} image ${activeIndex + 1}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="mx-auto h-12 w-12" />
                <p className="mt-2 text-sm">No images uploaded</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const image = product.images[index];
              return (
                <button
                  key={index}
                  onClick={() => image && setActiveIndex(index)}
                  disabled={!image}
                  className={
                    "aspect-square overflow-hidden rounded-xl border transition " +
                    (activeIndex === index
                      ? "border-brand-500 ring-2 ring-brand-100"
                      : "border-slate-200 hover:border-brand-300") +
                    (!image ? " cursor-not-allowed bg-slate-50 opacity-60" : "")
                  }
                >
                  {image ? (
                    <img
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-xs text-slate-300">
                      {index + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const {
    products,
    manufacturers,
    deleteProduct,
    loading,
    error,
    refreshProducts,
    addManufacturer,
    updateManufacturer,
    bulkUploadProducts,
  } = useInventory();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<"All" | ProductStatus>("All");
  const [manufacturerId, setManufacturerId] = useState("All");
  const [newManufacturerName, setNewManufacturerName] = useState("");
  const [editManufacturerName, setEditManufacturerName] = useState("");
  const [galleryProduct, setGalleryProduct] = useState<Product | null>(null);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const selectedManufacturer =
    manufacturerId === "All"
      ? null
      : manufacturers.find((manufacturer) => manufacturer.id === manufacturerId) ??
        null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.manufacturerName ?? "").toLowerCase().includes(q);
      const matchesManufacturer =
        manufacturerId === "All" || p.manufacturerId === manufacturerId;
      const matchesCategory = category === "All" || p.category === category;
      const matchesStatus = status === "All" || p.status === status;
      return matchesQuery && matchesManufacturer && matchesCategory && matchesStatus;
    });
  }, [products, query, manufacturerId, category, status]);

  async function handleAddManufacturer() {
    if (!newManufacturerName.trim()) return;
    try {
      setBusyMessage("Adding manufacturer...");
      const created = await addManufacturer(newManufacturerName);
      setManufacturerId(created.id);
      setEditManufacturerName(created.name);
      setNewManufacturerName("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add manufacturer.");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleRenameManufacturer() {
    if (!selectedManufacturer || !editManufacturerName.trim()) return;
    try {
      setBusyMessage("Updating manufacturer...");
      await updateManufacturer(selectedManufacturer.id, editManufacturerName);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to update manufacturer."
      );
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleBulkUpload(file: File | undefined) {
    if (!file) return;
    if (!selectedManufacturer) {
      alert("Select a manufacturer before bulk uploading products.");
      return;
    }
    try {
      setBulkResult(null);
      setBusyMessage("Importing products...");
      const result = await bulkUploadProducts(selectedManufacturer.id, file);
      setBulkResult(
        `Imported ${result.imported} product rows` +
          (result.skipped ? `, skipped ${result.skipped}` : "") +
          "."
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to import products.");
    } finally {
      setBusyMessage(null);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${formatNumber(filtered.length)} of ${formatNumber(
          products.length
        )} products shown`}
      />

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

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1fr_1fr]">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Manufacturer controls
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={manufacturerId}
              onChange={(event) => {
                setManufacturerId(event.target.value);
                const manufacturer = manufacturers.find(
                  (m) => m.id === event.target.value
                );
                setEditManufacturerName(manufacturer?.name ?? "");
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="All">All manufacturers</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => uploadRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              <UploadIcon className="h-4 w-4" />
              Bulk upload
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(event) => handleBulkUpload(event.target.files?.[0])}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            CSV/Excel columns: name, sku, category, description, price, cost,
            quantity, reorderLevel, status.
          </p>
          {bulkResult && (
            <p className="mt-2 text-sm font-medium text-emerald-600">
              {bulkResult}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Add manufacturer
            </p>
            <div className="flex gap-2">
              <input
                value={newManufacturerName}
                onChange={(event) => setNewManufacturerName(event.target.value)}
                placeholder="New manufacturer name"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <button
                onClick={handleAddManufacturer}
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600"
                aria-label="Add manufacturer"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Rename selected
            </p>
            <div className="flex gap-2">
              <input
                value={editManufacturerName}
                onChange={(event) => setEditManufacturerName(event.target.value)}
                disabled={!selectedManufacturer}
                placeholder="Select a manufacturer"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
              <button
                onClick={handleRenameManufacturer}
                disabled={!selectedManufacturer}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
        {busyMessage && (
          <p className="text-sm font-medium text-brand-600 xl:col-span-2">
            {busyMessage}
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, SKU, category or manufacturer..."
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
            Try adjusting your filters or upload products for this manufacturer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
          {filtered.map((p) => {
            const level = stockLevel(p);
            return (
              <div
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <button
                  onClick={() => setGalleryProduct(p)}
                  className="relative aspect-square w-full bg-slate-100 text-left"
                  aria-label={`View ${p.name} images`}
                >
                  {p.images[0] ? (
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
                  <div className="absolute left-2 top-2">
                    <Badge tone={statusTone[p.status]} className="text-[10px]">
                      {p.status}
                    </Badge>
                  </div>
                  {p.images.length > 0 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
                      {p.images.length}/5
                    </span>
                  )}
                </button>

                <div className="flex flex-1 flex-col p-2">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                    {p.manufacturerName ?? "No manufacturer"}
                  </p>
                  <h3 className="mt-0.5 line-clamp-1 text-xs font-semibold text-slate-900">
                    {p.name}
                  </h3>
                  <p className="truncate text-[11px] text-slate-400">{p.sku}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {p.category}
                  </p>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCurrency(p.price * (1 - p.discountPercent / 100))}
                    </span>
                    <Badge
                      tone={
                        level === "out"
                          ? "red"
                          : level === "low"
                          ? "amber"
                          : "green"
                      }
                      className="text-[10px]"
                    >
                      {level === "out" ? "Out" : formatNumber(p.quantity)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
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
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button
                      onClick={() => setGalleryProduct(p)}
                      className="ml-auto text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {galleryProduct && (
        <ProductGallery
          product={galleryProduct}
          onClose={() => setGalleryProduct(null)}
        />
      )}
    </>
  );
}
