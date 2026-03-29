import { finalizeExperiments } from "../utils/finalize-experiments";

export const demoInfo = {
  id: "demo3",
  name: "视锥体剔除对照",
  description: "第三个演示：关闭 frustumCulling，与开启 frustumCulling。",
  showInMenu: true,
  experiments: finalizeExperiments(import.meta, "demo3", [
    { id: "webgl1", title: "视锥体剔除 开启", file: () => import("./webgl1") },
    { id: "webgl2", title: "视锥体剔除 关闭", file: () => import("./webgl2") },
  ]),
};
