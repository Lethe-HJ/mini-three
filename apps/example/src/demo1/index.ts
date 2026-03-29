import { finalizeExperiments } from "../utils/finalize-experiments";

export const demoInfo = {
  id: "demo1",
  name: "phong与lambert材质",
  description: "第一个演示：基本的phong材质和lambert材质旋转展示",
  showInMenu: true,
  experiments: finalizeExperiments(import.meta, "demo1", [
    { id: "webgl", title: "mini-three实现", file: () => import("./webgl") },
    { id: "threejs", title: "three.js实现", file: () => import("./threejs") },
  ]),
};
