import postgres from "postgres";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(root, name);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      )
        val = val.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadEnvFiles();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql.unsafe(
    "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS completed_at timestamptz",
  );
  console.log("✓ Added completed_at to tournaments");

  await sql.unsafe(
    "ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS is_bye boolean NOT NULL DEFAULT false",
  );
  console.log("✓ Added is_bye to fixtures");

  try {
    await sql.unsafe(
      "ALTER TABLE members ADD CONSTRAINT members_tournament_name_unique UNIQUE (tournament_id, display_name)",
    );
    console.log(
      "✓ Added unique constraint on members(tournament_id, display_name)",
    );
  } catch (e) {
    console.log("⏭ Unique constraint already exists or skipped:", e.message);
  }

  console.log("Migration complete.");
} finally {
  await sql.end();
}
