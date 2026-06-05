import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { NewProduct, Product, ProductStatus } from "./types";

export type ProductInput = Omit<NewProduct, "images">;

export interface ProductImageRecord {
  id: string;
  productId: string;
  objectKey: string;
  originalFilename: string | null;
  contentType: string;
  sizeBytes: number | null;
  sortOrder: number;
}

export interface ProductRecord extends Omit<Product, "images"> {
  imageRecords: ProductImageRecord[];
}

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  selling_price: number;
  unit_cost: number;
  quantity: number;
  reorder_level: number;
  status: ProductStatus;
  created_at: Date;
}

interface ProductImageRow extends RowDataPacket {
  id: number;
  product_id: number;
  object_key: string;
  original_filename: string | null;
  content_type: string;
  size_bytes: number | null;
  sort_order: number;
}

function mapProduct(row: ProductRow, imageRecords: ProductImageRecord[]): ProductRecord {
  return {
    id: String(row.id),
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description ?? "",
    price: Number(row.selling_price),
    cost: Number(row.unit_cost),
    quantity: Number(row.quantity),
    reorderLevel: Number(row.reorder_level),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    imageRecords,
  };
}

function mapImage(row: ProductImageRow): ProductImageRecord {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    objectKey: row.object_key,
    originalFilename: row.original_filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
  };
}

async function listImagesByProductIds(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, ProductImageRecord[]>();

  const placeholders = productIds.map(() => "?").join(",");
  const [rows] = await getPool().query<ProductImageRow[]>(
    `SELECT id, product_id, object_key, original_filename, content_type, size_bytes, sort_order
     FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY product_id ASC, sort_order ASC, id ASC`,
    productIds
  );

  const map = new Map<string, ProductImageRecord[]>();
  for (const row of rows) {
    const productId = String(row.product_id);
    const existing = map.get(productId) ?? [];
    existing.push(mapImage(row));
    map.set(productId, existing);
  }
  return map;
}

export async function listProductRecords() {
  const [rows] = await getPool().query<ProductRow[]>(
    `SELECT id, name, sku, category, description, selling_price, unit_cost,
            quantity, reorder_level, status, created_at
     FROM products
     ORDER BY created_at DESC, id DESC`
  );
  const imageMap = await listImagesByProductIds(rows.map((row) => String(row.id)));

  return rows.map((row) => mapProduct(row, imageMap.get(String(row.id)) ?? []));
}

export async function getProductRecord(id: string) {
  const [rows] = await getPool().query<ProductRow[]>(
    `SELECT id, name, sku, category, description, selling_price, unit_cost,
            quantity, reorder_level, status, created_at
     FROM products
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;

  const imageMap = await listImagesByProductIds([id]);
  return mapProduct(row, imageMap.get(id) ?? []);
}

export async function getProductImageKeys(id: string) {
  const [rows] = await getPool().query<ProductImageRow[]>(
    `SELECT id, product_id, object_key, original_filename, content_type, size_bytes, sort_order
     FROM product_images
     WHERE product_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [id]
  );
  return rows.map((row) => row.object_key);
}

export async function createProductRecord(data: ProductInput) {
  const [result] = await getPool().execute<ResultSetHeader>(
    `INSERT INTO products
       (name, sku, category, description, selling_price, unit_cost, quantity, reorder_level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.sku,
      data.category,
      data.description,
      data.price,
      data.cost,
      data.quantity,
      data.reorderLevel,
      data.status,
    ]
  );
  return String(result.insertId);
}

export async function insertProductImages(
  productId: string,
  images: {
    objectKey: string;
    originalFilename: string;
    contentType: string;
    sizeBytes: number;
    sortOrder: number;
  }[]
) {
  if (images.length === 0) return;

  await getPool().query(
    `INSERT INTO product_images
       (product_id, object_key, original_filename, content_type, size_bytes, sort_order)
     VALUES ?`,
    [
      images.map((image) => [
        productId,
        image.objectKey,
        image.originalFilename,
        image.contentType,
        image.sizeBytes,
        image.sortOrder,
      ]),
    ]
  );
}

export async function updateProductRecord(
  id: string,
  data: Partial<ProductInput>
) {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  const add = (column: string, value: string | number) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (data.name !== undefined) add("name", data.name);
  if (data.sku !== undefined) add("sku", data.sku);
  if (data.category !== undefined) add("category", data.category);
  if (data.description !== undefined) add("description", data.description);
  if (data.price !== undefined) add("selling_price", data.price);
  if (data.cost !== undefined) add("unit_cost", data.cost);
  if (data.quantity !== undefined) add("quantity", data.quantity);
  if (data.reorderLevel !== undefined) add("reorder_level", data.reorderLevel);
  if (data.status !== undefined) add("status", data.status);

  if (fields.length === 0) return;

  values.push(id);
  await getPool().execute(
    `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteProductRecord(id: string) {
  await getPool().execute("DELETE FROM products WHERE id = ?", [id]);
}

export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
