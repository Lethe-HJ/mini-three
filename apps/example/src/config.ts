export const demos = ["demo1", "demo2", "demo3"];

/**
 * 仓库内 `apps/example/src` 在 GitHub 上的 blob 根路径（无末尾斜杠）。
 * Fork 后可设环境变量 `VITE_GITHUB_SOURCE_APPS_EXAMPLE_SRC` 覆盖。
 */
export const GITHUB_SOURCE_APPS_EXAMPLE_SRC =
  import.meta.env.VITE_GITHUB_SOURCE_APPS_EXAMPLE_SRC ??
  "https://github.com/Lethe-HJ/mini-three/blob/main/apps/example/src";
