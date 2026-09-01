import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node24",
  outDir: "dist",
  platform: "node",
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  shims: false,
});
