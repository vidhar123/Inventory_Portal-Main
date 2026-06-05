function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getMysqlConfig() {
  return {
    host: required("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: required("MYSQL_DATABASE"),
    user: required("MYSQL_USER"),
    password: required("MYSQL_PASSWORD"),
    ssl: process.env.MYSQL_SSL === "true",
  };
}

export function getStorageConfig() {
  return {
    endpoint: required("LINODE_OBJECT_STORAGE_ENDPOINT"),
    region: required("LINODE_OBJECT_STORAGE_REGION"),
    bucket: required("LINODE_OBJECT_STORAGE_BUCKET"),
    accessKeyId: required("LINODE_OBJECT_STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: required("LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY"),
    signedUrlExpiresSeconds: Number(
      process.env.LINODE_SIGNED_URL_EXPIRES_SECONDS ?? 3600
    ),
  };
}
