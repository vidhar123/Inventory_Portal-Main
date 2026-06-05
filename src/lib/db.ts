import mysql, { Pool } from "mysql2/promise";
import { getMysqlConfig } from "./env";

let pool: Pool | null = null;

export function getPool() {
  if (pool) return pool;

  const config = getMysqlConfig();
  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
  });

  return pool;
}
