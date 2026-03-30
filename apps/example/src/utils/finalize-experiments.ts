import { GITHUB_SOURCE_APPS_EXAMPLE_SRC } from "../config";
import type { DemoExperiment } from "../layout";

/** 生产构建由 `vite.config.ts` 里插件注入，见 `injectExperimentChunkUrlMap` */
declare global {
  var __MINI_THREE_EXP_CHUNK_URLS__:
    | Record<string, Record<string, string>>
    | undefined;
}

/** 在 `index.ts` 里写的简表；`file` 写 `() => import("./xxx")` */
export type ExperimentInput = {
  id: string;
  title: string;
  file: () => Promise<unknown>;
  /**
   * 入口相对路径，默认 `./${id}.ts`（id 须与入口文件名一致，不含扩展名）。
   * 若 id 与文件名不一致，再填此项，例如 `{ id: "a", module: "./foo.ts", file: () => import("./foo") }`。
   */
  module?: string;
};

function resolveScriptSrc(
  meta: ImportMeta,
  demoFolder: string,
  modulePath: string | undefined,
  id: string,
): string {
  const relPath = modulePath ?? `./${id}.ts`;
  const globKey = relPath.startsWith("./") ? relPath : `./${relPath}`;
  const fromMap =
    globalThis.__MINI_THREE_EXP_CHUNK_URLS__?.[demoFolder]?.[globKey];
  if (fromMap) {
    return fromMap.startsWith("http")
      ? fromMap
      : new URL(fromMap, meta.url).href;
  }
  return new URL(relPath, meta.url).href;
}

export function finalizeExperiments(
  meta: ImportMeta,
  /** `apps/example/src` 下 demo 目录名，如 `demo2` */
  demoFolder: string,
  list: ExperimentInput[],
): DemoExperiment[] {
  return list.map((e) => {
    const rel = (e.module ?? `./${e.id}.ts`).replace(/^\.\//, "");
    return {
      id: e.id,
      title: e.title,
      file: e.file,
      scriptSrc: resolveScriptSrc(meta, demoFolder, e.module, e.id),
      githubUrl: `${GITHUB_SOURCE_APPS_EXAMPLE_SRC}/${demoFolder}/${rel}`,
    };
  });
}
