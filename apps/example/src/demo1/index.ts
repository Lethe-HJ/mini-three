export const demoInfo = {
  id: "demo1",
  name: "phong与lambert材质",
  description: "第一个演示：基本的phong材质和lambert材质旋转展示",
  showInMenu: true,
  leftTitle: "WebGL Implementation",
  rightTitle: "Three.js Standard",
  leftFile: "webgl.ts",
  rightFile: "threejs.ts",
  init: async () => {
    await Promise.all([import("./webgl"), import("./threejs")]);
  },
};
