import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageConfig } from "./env";

let client: S3Client | null = null;

function getClient() {
  if (client) return client;

  const config = getStorageConfig();
  client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
}

function safeFileName(name: string) {
  const fallback = "product-image";
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

export function makeProductImageKey(productId: string, fileName: string) {
  return `product-images/${productId}/${crypto.randomUUID()}-${safeFileName(
    fileName
  )}`;
}

export async function uploadProductImage({
  key,
  file,
}: {
  key: string;
  file: File;
}) {
  const config = getStorageConfig();
  const body = Buffer.from(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      ContentLength: file.size,
    })
  );
}

export async function getSignedImageUrl(key: string) {
  const config = getStorageConfig();

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
    { expiresIn: config.signedUrlExpiresSeconds }
  );
}

export async function deleteProductImages(keys: string[]) {
  if (keys.length === 0) return;

  const config = getStorageConfig();
  await getClient().send(
    new DeleteObjectsCommand({
      Bucket: config.bucket,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    })
  );
}
