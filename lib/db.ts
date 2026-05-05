import postgres from "postgres";

const globalForSql = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForSql.sql) {
    globalForSql.sql = postgres(url, { max: 8, prepare: false });
  }
  return globalForSql.sql;
}
