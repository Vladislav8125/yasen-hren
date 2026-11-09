import fs from "node:fs";
import pg from "pg";

const output = process.argv[2];
if (!output || !process.env.DATABASE_URL) throw new Error("Output path and DATABASE_URL are required");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const columns = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  const snapshot = { createdAt: new Date().toISOString(), columns: columns.rows, tables: {} };
  for (const { table_name: table } of tables.rows) {
    const escaped = `"${table.replaceAll('"', '""')}"`;
    snapshot.tables[table] = (await client.query(`SELECT * FROM ${escaped}`)).rows;
  }
  fs.writeFileSync(output, JSON.stringify(snapshot));
} finally {
  await client.end();
}
