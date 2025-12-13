import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
//We extract Pool this way because 'pg' is a CommonJS module used in an ESM project
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a standard PostgreSQL connection pool for local development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with the standard pool
export const db = drizzle(pool);