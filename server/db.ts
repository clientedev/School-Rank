import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export let pool: any = null;
export let db: any = null;

const connectionString = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

if (connectionString) {
  // Railway internal URLs (*.railway.internal) don't use SSL.
  // External URLs often require SSL. Let pg decide from the connection string,
  // but allow override via DATABASE_SSL env var.
  const needsSsl =
    process.env.DATABASE_SSL === "true" ||
    (!connectionString.includes("railway.internal") &&
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1") &&
      !connectionString.includes("sslmode=disable"));

  pool = new Pool({
    connectionString,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  db = drizzle(pool, { schema });
} else {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL must be set in production.",
    );
  }
  console.log("No DATABASE_URL found. Running with in-memory storage.");
}

