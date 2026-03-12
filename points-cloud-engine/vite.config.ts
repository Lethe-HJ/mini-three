import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // 将 points-cloud-engine / point-cloud-engine 解析到 core 入口
      "points-cloud-engine": resolve(__dirname, "src/core/index.ts"),
    },
  },
});
