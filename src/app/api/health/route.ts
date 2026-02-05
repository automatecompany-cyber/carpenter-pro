import { NextResponse } from "next/server";

export async function GET() {
  const hasUrl = !!process.env.TURSO_DATABASE_URL;
  const hasToken = !!process.env.TURSO_AUTH_TOKEN;
  const url = process.env.TURSO_DATABASE_URL || "NOT SET";

  // Try database connection
  let dbStatus = "not tested";
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: url.replace("libsql://", "https://"),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const result = await client.execute("SELECT 1 as test");
    dbStatus = "connected - rows: " + result.rows.length;
  } catch (e: any) {
    dbStatus = "error: " + e.message;
  }

  return NextResponse.json({
    envUrl: hasUrl ? url.substring(0, 30) + "..." : "NOT SET",
    envToken: hasToken ? "SET" : "NOT SET",
    dbStatus,
  });
}
