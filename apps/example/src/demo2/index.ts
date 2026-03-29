import { finalizeExperiments } from "../utils/finalize-experiments";

export const demoInfo = {
  id: "demo2",
  name: "1万立方体",
  description: "第二个演示：10000个正方体的旋转场景渲染",
  showInMenu: true,
  experiments: finalizeExperiments(import.meta, [
    { id: "webgl", title: "mini-three实现", file: () => import("./webgl") },
    { id: "threejs", title: "three.js实现", file: () => import("./threejs") },
  ]),
};
