import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Convert libsql:// to https:// for HTTP transport (needed for Vercel serverless)
const url = process.env.TURSO_DATABASE_URL!.replace("libsql://", "https://");

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
