import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page and API route is dynamic (force-dynamic), so no incremental cache is needed.
export default defineCloudflareConfig();
