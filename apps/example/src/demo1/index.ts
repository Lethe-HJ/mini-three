import { finalizeExperiments } from "../utils/finalize-experiments";

export const demoInfo = {
  id: "demo1",
  name: "phong与lambert材质",
  description: "第一个演示：基本的phong材质和lambert材质旋转展示",
  showInMenu: true,
  experiments: finalizeExperiments(import.meta, [
    { id: "webgl", title: "WebGL Implementation", file: () => import("./webgl") },
    { id: "threejs", title: "Three.js Standard", file: () => import("./threejs") },
  ]),
};
