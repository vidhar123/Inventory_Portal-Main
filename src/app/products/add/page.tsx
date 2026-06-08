"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { PageHeader } from "@/components/PageHeader";
import { ImageUploader, SelectedImage } from "@/components/ImageUploader";
import { CATEGORIES, ProductStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type FormState = {
  manufacturerId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  cost: string;
  quantity: string;
  reorderLevel: string;
  status: ProductStatus;
  images: SelectedImage[];
};

const initialForm: FormState = {
  manufacturerId: "",
  name: "",
  sku: "",
  category: CATEGORIES[0],
  description: "",
  price: "",
  cost: "",
  quantity: "",
  reorderLevel: "10",
  status: "active",
  images: [],
};

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default function AddProductPage() {
  const router = useRouter();
  const { addProduct, manufacturers } = useInventory();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.manufacturerId) e.manufacturerId = "Manufacturer is required.";
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.sku.trim()) e.sku = "SKU is required.";
    if (form.price === "" || Number(form.price) < 0)
      e.price = "Enter a valid price.";
    if (form.cost === "" || Number(form.cost) < 0)
      e.cost = "Enter a valid cost.";
    if (form.quantity === "" || Number(form.quantity) < 0)
      e.quantity = "Enter a valid quantity.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.set("manufacturerId", form.manufacturerId);
    formData.set("name", form.name.trim());
    formData.set("sku", form.sku.trim().toUpperCase());
    formData.set("category", form.category);
    formData.set("description", form.description.trim());
    formData.set("price", form.price);
    formData.set("cost", form.cost);
    formData.set("quantity", form.quantity);
    formData.set("reorderLevel", form.reorderLevel || "0");
    formData.set("status", form.status);
    for (const image of form.images) {
      formData.append("images", image.file);
    }

    try {
      setSaving(true);
      await addProduct(formData);
      router.push("/products");
    } catch (error) {
      setErrors({
        form:
          error instanceof Error ? error.message : "Failed to save product.",
      });
    } finally {
      setSaving(false);
    }
  }

  const margin =
    Number(form.price) > 0
      ? Math.round(
          ((Number(form.price) - Number(form.cost)) / Number(form.price)) * 100
        )
      : null;

  return (
    <>
      <PageHeader
        title="Add Product"
        subtitle="Create a new item and add it to your catalog."
      >
        <Link
          href="/products"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
      </PageHeader>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Product details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Manufacturer</label>
                <select
                  className={cn(
                    inputClass,
                    errors.manufacturerId && "border-rose-400"
                  )}
                  value={form.manufacturerId}
                  onChange={(e) => set("manufacturerId", e.target.value)}
                >
                  <option value="">Select manufacturer</option>
                  {manufacturers.map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </select>
                {errors.manufacturerId && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.manufacturerId}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Product name</label>
                <input
                  className={cn(inputClass, errors.name && "border-rose-400")}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Aurora Wireless Headphones"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>SKU</label>
                <input
                  className={cn(inputClass, errors.sku && "border-rose-400")}
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  placeholder="ELEC-AWH-01"
                />
                {errors.sku && (
                  <p className="mt-1 text-xs text-rose-600">{errors.sku}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  className={cn(inputClass, "min-h-24 resize-y")}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Short description of the product…"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Pricing & stock
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Selling price (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={cn(inputClass, errors.price && "border-rose-400")}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-rose-600">{errors.price}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Unit cost (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={cn(inputClass, errors.cost && "border-rose-400")}
                  value={form.cost}
                  onChange={(e) => set("cost", e.target.value)}
                  placeholder="0.00"
                />
                {errors.cost && (
                  <p className="mt-1 text-xs text-rose-600">{errors.cost}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Quantity in stock</label>
                <input
                  type="number"
                  min="0"
                  className={cn(inputClass, errors.quantity && "border-rose-400")}
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Reorder level</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.reorderLevel}
                  onChange={(e) => set("reorderLevel", e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
            {margin !== null && (
              <p className="mt-4 text-sm text-slate-500">
                Estimated margin:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    margin >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {margin}%
                </span>{" "}
                ({formatCurrency(Number(form.price) - Number(form.cost))} per
                unit)
              </p>
            )}
          </section>
        </div>

        {/* Right: images + status + submit */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-slate-900">
              Product images
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              Add up to 5 images. The first image is used as the cover.
            </p>
            <ImageUploader
              images={form.images}
              onChange={(imgs) => set("images", imgs)}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Status
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(["active", "draft", "archived"] as ProductStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium capitalize transition",
                    form.status === s
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600"
            >
              {saving ? "Saving..." : "Save product"}
            </button>
            <Link
              href="/products"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
          {errors.form && (
            <p className="text-sm font-medium text-rose-600">{errors.form}</p>
          )}
        </div>
      </form>
    </>
  );
}
