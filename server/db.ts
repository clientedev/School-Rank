import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export let pool: any = null;
export let db: any = null;

const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  const isInternal =
    connectionString.includes("railway.internal") ||
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("sslmode=disable");

  const needsSsl = process.env.DATABASE_SSL === "true" || !isInternal;

  // Parse URL manually so special characters in the password are
  // correctly URL-decoded before being passed to pg individually.
  // Passing raw connectionString can fail when the password contains
  // characters like %, @, # that confuse pg's URL parser.
  let poolConfig: any;
  try {
    const u = new URL(connectionString);
    poolConfig = {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  } catch {
    // Fallback: use connectionString as-is if URL parsing fails
    poolConfig = {
      connectionString,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  pool = new Pool(poolConfig);
  db = drizzle(pool, { schema });
} else {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production.");
  }
  console.log("No DATABASE_URL found. Running with in-memory storage.");
}
