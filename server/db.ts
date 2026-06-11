import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export let pool: any = null;
export let db: any = null;

const connectionString = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
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

