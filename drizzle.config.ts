import { defineConfig } from "drizzle-kit";

// Generates SQL into ./migrations; apply them with `npm run db:migrate:local|remote`.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
