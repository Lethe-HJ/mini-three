export const demoInfo = {
  id: "demo1",
  name: "Demo 1",
  description: "第一个演示：基本的phong材质和lambert材质旋转展示",
  showInMenu: true,
  webglFile: "webgl.ts",
  threejsFile: "threejs.ts",
  init: async () => {
    // 动态加载 webgl.ts 和 threejs.ts
    await Promise.all([import("./webgl"), import("./threejs")]);
  },
};
