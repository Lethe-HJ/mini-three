export const demoInfo = {
  id: "demo2",
  name: "Demo 2",
  description: "第二个演示：10000个正方体的旋转场景渲染",
  showInMenu: true,
  webglFile: "webgl.ts",
  threejsFile: "threejs.ts",
  init: async () => {
    // 动态加载 webgl.ts 和 threejs.ts
    await Promise.all([import("./webgl"), import("./threejs")]);
  },
};
