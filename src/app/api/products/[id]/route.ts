import { NextRequest, NextResponse } from "next/server";
import {
  deleteProductRecord,
  deleteProductImageRecords,
  getProductImageKeys,
  getProductRecord,
  insertProductImages,
  updateProductRecord,
  ProductInput,
  ProductRecord,
} from "@/lib/productRepository";
import {
  deleteProductImages,
  getSignedImageUrl,
  makeProductImageKey,
  uploadProductImage,
} from "@/lib/storage";
import { Product, ProductStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses: ProductStatus[] = ["active", "draft", "archived"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function toClientProduct(record: ProductRecord): Promise<Product> {
  const images = await Promise.all(
    record.imageRecords.map((image) => getSignedImageUrl(image.objectKey))
  );

  return {
    id: record.id,
    manufacturerId: record.manufacturerId,
    manufacturerName: record.manufacturerName,
    name: record.name,
    sku: record.sku,
    category: record.category,
    description: record.description,
    price: record.price,
    discountPercent: record.discountPercent,
    cost: record.cost,
    quantity: record.quantity,
    reorderLevel: record.reorderLevel,
    status: record.status,
    images,
    createdAt: record.createdAt,
  };
}

function parsePatch(body: Record<string, unknown>): Partial<ProductInput> {
  const patch: Partial<ProductInput> = {};

  const textFields = ["name", "sku", "category", "description"] as const;
  for (const field of textFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") {
        throw new Error(`${field} must be a string.`);
      }
      patch[field] =
        field === "sku"
          ? body[field].trim().toUpperCase()
          : body[field].trim();
    }
  }

  if (body.manufacturerId !== undefined) {
    if (body.manufacturerId !== null && typeof body.manufacturerId !== "string") {
      throw new Error("manufacturerId must be a string.");
    }
    patch.manufacturerId = body.manufacturerId || null;
  }

  const numberFields = [
    "price",
    "discountPercent",
    "cost",
    "quantity",
    "reorderLevel",
  ] as const;
  for (const field of numberFields) {
    if (body[field] !== undefined) {
      const value = Number(body[field]);
      if (Number.isNaN(value) || value < 0) {
        throw new Error(`${field} must be a non-negative number.`);
      }
      patch[field] =
        field === "quantity" || field === "reorderLevel"
          ? Math.floor(value)
          : value;
    }
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !statuses.includes(body.status as ProductStatus)) {
      throw new Error("Invalid product status.");
    }
    patch.status = body.status as ProductStatus;
  }

  return patch;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : undefined;
}

function parseFormPatch(formData: FormData): Partial<ProductInput> {
  const patch: Partial<ProductInput> = {};
  const textFields = ["name", "sku", "category", "description"] as const;
  for (const field of textFields) {
    const value = stringValue(formData, field);
    if (value !== undefined) {
      patch[field] = field === "sku" ? value.toUpperCase() : value;
    }
  }

  const manufacturerId = stringValue(formData, "manufacturerId");
  if (manufacturerId !== undefined) patch.manufacturerId = manufacturerId || null;

  const numberFields = [
    "price",
    "discountPercent",
    "cost",
    "quantity",
    "reorderLevel",
  ] as const;
  for (const field of numberFields) {
    const raw = stringValue(formData, field);
    if (raw !== undefined) {
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0) {
        throw new Error(`${field} must be a non-negative number.`);
      }
      patch[field] =
        field === "quantity" || field === "reorderLevel"
          ? Math.floor(value)
          : value;
    }
  }

  const status = stringValue(formData, "status");
  if (status !== undefined) {
    if (!statuses.includes(status as ProductStatus)) {
      throw new Error("Invalid product status.");
    }
    patch.status = status as ProductStatus;
  }

  return patch;
}

function parseReplacementImages(formData: FormData) {
  const shouldReplace = stringValue(formData, "replaceImages") === "true";
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > 5) throw new Error("You can upload up to 5 images.");
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }
  }

  return { shouldReplace, files };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    const uploadedKeys: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const patch = parseFormPatch(formData);
      const { shouldReplace, files } = parseReplacementImages(formData);

      await updateProductRecord(id, patch);

      if (shouldReplace) {
        const oldKeys = await getProductImageKeys(id);
        const imageRows = [];
        for (const [index, file] of files.entries()) {
          const objectKey = makeProductImageKey(id, file.name);
          await uploadProductImage({ key: objectKey, file });
          uploadedKeys.push(objectKey);
          imageRows.push({
            objectKey,
            originalFilename: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            sortOrder: index,
          });
        }
        await deleteProductImageRecords(id);
        await insertProductImages(id, imageRows);
        await deleteProductImages(oldKeys).catch((error) => {
          console.error("Failed to delete replaced product images", error);
        });
      }

      const updated = await getProductRecord(id);
      if (!updated) return jsonError("Product not found.", 404);
      return NextResponse.json({ product: await toClientProduct(updated) });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const patch = parsePatch(body);

    await updateProductRecord(id, patch);
    const updated = await getProductRecord(id);
    if (!updated) return jsonError("Product not found.", 404);

    return NextResponse.json({ product: await toClientProduct(updated) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update product.";
    const isValidationError =
      message.includes("must be") || message.includes("Invalid");

    console.error("Failed to update product", error);
    return jsonError(message, isValidationError ? 400 : 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const keys = await getProductImageKeys(id);
    await deleteProductRecord(id);

    await deleteProductImages(keys).catch((error) => {
      console.error("Failed to delete product images from object storage", error);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete product", error);
    return jsonError("Failed to delete product.", 500);
  }
}
