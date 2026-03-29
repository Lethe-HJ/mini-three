import { finalizeExperiments } from "../utils/finalize-experiments";

export const demoInfo = {
  id: "demo3",
  name: "视锥体剔除对照",
  description: "第三个演示：关闭 frustumCulling，与开启 frustumCulling。",
  showInMenu: true,
  experiments: finalizeExperiments(import.meta, [
    { id: "webgl1", title: "Frustum culling: OFF", file: () => import("./webgl1") },
    { id: "webgl2", title: "Frustum culling: ON", file: () => import("./webgl2") },
  ]),
};
