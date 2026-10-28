import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// Exposes Cloudflare bindings (D1 `DB`) to `next dev` via getCloudflareContext().
initOpenNextCloudflareForDev();
