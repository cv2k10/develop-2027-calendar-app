import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

// D1 bindings are scoped to the current request, so build the client per call.
export function getDb() {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error("D1 binding `DB` is not configured");
  }
  return drizzle(env.DB, { schema });
}
