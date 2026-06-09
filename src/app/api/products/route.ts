import { NextRequest, NextResponse } from "next/server";
import {
  createProductRecord,
  getProductRecord,
  insertProductImages,
  listProductRecords,
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

const MAX_IMAGES = 5;
const statuses: ProductStatus[] = ["active", "draft", "archived"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(formData: FormData, key: string) {
  const raw = stringValue(formData, key);
  const value = Number(raw);
  if (raw === "" || Number.isNaN(value) || value < 0) {
    throw new Error(`${key} must be a non-negative number.`);
  }
  return value;
}

function parseProductInput(formData: FormData): ProductInput {
  const manufacturerId = stringValue(formData, "manufacturerId");
  const name = stringValue(formData, "name");
  const sku = stringValue(formData, "sku").toUpperCase();
  const category = stringValue(formData, "category");
  const status = stringValue(formData, "status") as ProductStatus;

  if (!name) throw new Error("Product name is required.");
  if (!sku) throw new Error("SKU is required.");
  if (!category) throw new Error("Category is required.");
  if (!statuses.includes(status)) throw new Error("Invalid product status.");

  return {
    manufacturerId: manufacturerId || null,
    name,
    sku,
    category,
    description: stringValue(formData, "description"),
    price: numberValue(formData, "price"),
    discountPercent: Number(stringValue(formData, "discountPercent") || 0),
    cost: numberValue(formData, "cost"),
    quantity: Math.floor(numberValue(formData, "quantity")),
    reorderLevel: Math.floor(numberValue(formData, "reorderLevel")),
    status,
  };
}

function parseImageFiles(formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > MAX_IMAGES) {
    throw new Error(`You can upload up to ${MAX_IMAGES} images.`);
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }
  }

  return files;
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

export async function GET() {
  try {
    const products = await Promise.all(
      (await listProductRecords()).map(toClientProduct)
    );
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products", error);
    return jsonError("Failed to fetch products.", 500);
  }
}

export async function POST(request: NextRequest) {
  let productId: string | null = null;
  const uploadedKeys: string[] = [];

  try {
    const formData = await request.formData();
    const product = parseProductInput(formData);
    const files = parseImageFiles(formData);

    productId = await createProductRecord(product);

    const images = [];
    for (const [index, file] of files.entries()) {
      const objectKey = makeProductImageKey(productId, file.name);
      await uploadProductImage({ key: objectKey, file });
      uploadedKeys.push(objectKey);
      images.push({
        objectKey,
        originalFilename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        sortOrder: index,
      });
    }

    await insertProductImages(productId, images);

    const created = await getProductRecord(productId);
    if (!created) return jsonError("Product was not found after creation.", 500);

    return NextResponse.json(
      { product: await toClientProduct(created) },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await deleteProductImages(uploadedKeys).catch((deleteError) => {
        console.error("Failed to clean uploaded product images", deleteError);
      });
    }

    if (productId) {
      const { deleteProductRecord } = await import("@/lib/productRepository");
      await deleteProductRecord(productId).catch((deleteError) => {
        console.error("Failed to clean created product", deleteError);
      });
    }

    const message =
      error instanceof Error ? error.message : "Failed to create product.";
    const isValidationError =
      message.includes("required") ||
      message.includes("Invalid") ||
      message.includes("non-negative") ||
      message.includes("upload") ||
      message.includes("image");

    console.error("Failed to create product", error);
    return jsonError(message, isValidationError ? 400 : 500);
  }
}
