import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Always use this package directory as root (stable regardless of cwd or workspace).
    root: __dirname,
  },
};

export default nextConfig;
