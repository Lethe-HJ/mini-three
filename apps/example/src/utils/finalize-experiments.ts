import { GITHUB_SOURCE_APPS_EXAMPLE_SRC } from "../config";
import type { DemoExperiment } from "../layout";

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
      scriptSrc: new URL(e.module ?? `./${e.id}.ts`, meta.url).href,
      githubUrl: `${GITHUB_SOURCE_APPS_EXAMPLE_SRC}/${demoFolder}/${rel}`,
    };
  });
}
