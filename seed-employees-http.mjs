// Seed employees using Turso HTTP API
// Run with: node seed-employees-http.mjs

const TURSO_URL = "https://carpenter-pro-automatecompany-cyber.aws-eu-west-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzAzMDc0MjcsImlkIjoiYzY3NjMyZmItNmFmZi00M2VkLTlkMGEtZDE5Y2Q1MTg4NDU3IiwicmlkIjoiMjA1YzNkZDQtMWY1My00YWZmLWFiZDMtMzZmOTM4NDQ1ODY0In0.p4EPgnaJmEBVmxlJ6YLjScBGbX7X2lzgFtYC71GngZ0GqqWm4Oaer_26otUyeL-6Iukj62aRrTQqG6xY2f3JDw";
const AUTH_SECRET = "carpenterpro-secret-key-2024-very-secure";

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + AUTH_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function executeSQL(sql) {
  const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TURSO_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql } },
        { type: "close" }
      ]
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }
  return result;
}

async function seedEmployees() {
  console.log("Seeding employees...\n");

  const employees = [
    { name: "Max Müller", email: "max@carpenterpro.de", role: "boss", password: "boss123" },
    { name: "Anna Schmidt", email: "anna@carpenterpro.de", role: "manager", password: "manager123" },
    { name: "Hans Weber", email: "hans@carpenterpro.de", role: "worker", password: "worker123" },
    { name: "Peter Fischer", email: "peter@carpenterpro.de", role: "worker", password: "worker123" },
    { name: "Klaus Bauer", email: "klaus@carpenterpro.de", role: "worker", password: "worker123" },
  ];

  for (const emp of employees) {
    const passwordHash = await hashPassword(emp.password);
    const now = new Date().toISOString();

    const sql = `INSERT INTO employees (name, email, password_hash, role, is_active, created_at, updated_at) VALUES ('${emp.name}', '${emp.email}', '${passwordHash}', '${emp.role}', 1, '${now}', '${now}')`;

    try {
      await executeSQL(sql);
      console.log(`Created: ${emp.name} (${emp.role}) - ${emp.email}`);
    } catch (error) {
      if (error.message.includes("UNIQUE constraint")) {
        console.log(`Skipped: ${emp.name} (already exists)`);
      } else {
        console.error(`Error creating ${emp.name}:`, error.message);
      }
    }
  }

  console.log("\nDone! Sample login credentials:");
  console.log("  Boss: max@carpenterpro.de / boss123");
  console.log("  Manager: anna@carpenterpro.de / manager123");
  console.log("  Worker: hans@carpenterpro.de / worker123");
}

seedEmployees().catch(console.error);
