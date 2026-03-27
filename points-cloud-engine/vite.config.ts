import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        webgl: resolve(__dirname, "src/core/webgl/index.ts"),
        webgpu: resolve(__dirname, "src/core/webgpu/index.ts"),
      },
      name: "PointsCloudEngine",
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: ["three"],
      output: {
        globals: {
          three: "THREE",
        },
      },
    },
  },
});
